/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../../types';

export async function executePythonWithPyodide(code: string, packages: string[] = [], inputFiles: { filename: string, data: Uint8Array }[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      let pyodide = null;
      let pyodideLoadingPromise = null;

      async function getPyodide() {
        if (pyodide) return pyodide;
        if (pyodideLoadingPromise) return pyodideLoadingPromise;

        importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');

        pyodideLoadingPromise = self.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
        });
        pyodide = await pyodideLoadingPromise;
        pyodideLoadingPromise = null;
        return pyodide;
      }
      
      const mimeTypeMap = {
          'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'gif': 'image/gif',
          'svg': 'image/svg+xml', 'webp': 'image/webp', 'pdf': 'application/pdf', 'csv': 'text/csv',
          'txt': 'text/plain', 'json': 'application/json', 'html': 'text/html',
      };

      self.onmessage = async (event) => {
        const { code, packages, inputFiles } = event.data;
        let capturedStdout = '';
        
        try {
          const py = await getPyodide();
          
          py.setStdout({ batched: (str) => capturedStdout += str + '\\n' });
          py.setStderr({ batched: (str) => capturedStdout += '[STDERR] ' + str + '\\n' });

          py.FS.mkdirTree('/main/input');
          py.FS.mkdirTree('/main/output');
          
          if (inputFiles && inputFiles.length > 0) {
            for (const file of inputFiles) {
              py.FS.writeFile('/main/input/' + file.filename, file.data);
            }
            capturedStdout += 'Loaded input files: ' + inputFiles.map(f => f.filename).join(', ') + '\\n---\\n';
          }

          if (packages && packages.length > 0) {
            await py.loadPackage('micropip');
            const micropip = py.pyimport('micropip');
            capturedStdout += 'Installing packages: ' + packages.join(', ') + '...\\n';
            await micropip.install(packages);
            capturedStdout += 'Packages installed successfully.\\n---\\n';
          }
          
          let finalResult = await py.runPythonAsync(code);
          
          const filesToTransfer = [];
          try {
            const files = py.FS.readdir('/main/output');
            if (files) {
              for (const filename of files) {
                if (filename === '.' || filename === '..') continue;
                const filePath = '/main/output/' + filename;
                const fileData = py.FS.readFile(filePath, { encoding: 'binary' });
                
                const extension = filename.split('.').pop()?.toLowerCase() || '';
                const mimeType = mimeTypeMap[extension] || 'application/octet-stream';
                
                filesToTransfer.push({ filename, mimeType, data: fileData });
                py.FS.unlink(filePath);
              }
            }
          } catch (e) {
             capturedStdout += '\\n[ERROR] Failed to process output file: ' + e.message;
          }
          
          self.postMessage({ 
            success: true, 
            result: finalResult, 
            stdout: capturedStdout,
            files: filesToTransfer,
          });

        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        } finally {
            try {
                const py = pyodide;
                if(py) {
                    const cleanupDir = (dirPath) => {
                        if (!py.FS.analyzePath(dirPath).exists) return;
                        const entries = py.FS.readdir(dirPath);
                        for (const entry of entries) {
                            if (entry === '.' || entry === '..') continue;
                            const fullPath = dirPath + '/' + entry;
                            if (py.FS.isDir(py.FS.lookupPath(fullPath).node.mode)) {
                                cleanupDir(fullPath);
                            } else {
                                py.FS.unlink(fullPath);
                            }
                        }
                        py.FS.rmdir(dirPath);
                    };
                    cleanupDir('/main');
                }
            } catch(e) { /* ignore cleanup errors */ }
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = async (event) => {
      const { success, result, stdout, files, error } = event.data;
      
      worker.terminate();
      URL.revokeObjectURL(blob.toString());

      if (success) {
        let capturedStdout = stdout;
        
        const resultIsHtml = typeof result === 'string' && result.trim().match(/^(<!DOCTYPE html>|<html>)/i);

        if (resultIsHtml) {
            const componentId = `code-output-${Math.random().toString(36).substring(2, 9)}`;
            const componentData = {
                outputId: componentId,
                htmlOutput: result,
                textOutput: capturedStdout.trim(),
            };
            resolve(`[CODE_OUTPUT_COMPONENT]${JSON.stringify(componentData)}[/CODE_OUTPUT_COMPONENT]`);
            return;
        }

        if (result !== undefined && result !== null) {
          capturedStdout += String(result);
        }

        const attachmentLinks = [];
        if (files && files.length > 0) {
            const { fileStore } = await import('../../services/fileStore');
            for (const file of files) {
                try {
                    const blob = new Blob([file.data], { type: file.mimeType });
                    const fileKey = await fileStore.saveFile(blob);
                    const attachmentData = { filename: file.filename, fileKey, mimeType: file.mimeType };
                    attachmentLinks.push(`[FILE_ATTACHMENT_COMPONENT]${JSON.stringify(attachmentData)}[/FILE_ATTACHMENT_COMPONENT]`);
                } catch(e) {
                    capturedStdout += `\\n[ERROR] Failed to save output file '${file.filename}' to storage.`;
                }
            }
        }
        
        let finalOutput = capturedStdout.trim() || 'Code executed successfully with no output.';
        if (attachmentLinks.length > 0) {
          finalOutput += `\\n\\n${attachmentLinks.join('\\n')}`;
        }
        
        resolve(finalOutput);

      } else {
        resolve(`Execution failed:\\n${error}`);
      }
    };

    worker.onerror = (error) => {
      reject(new ToolError('executeCode', 'WORKER_ERROR', `Python worker failed: ${error.message}`, new Error(error.message)));
      worker.terminate();
      URL.revokeObjectURL(blob.toString());
    };

    worker.postMessage({ code, packages, inputFiles });
  });
}