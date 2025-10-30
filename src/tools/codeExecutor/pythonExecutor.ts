/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fileStore } from '../../services/fileStore';

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Pyodide (Python) Executor ---
declare global {
  interface Window {
    loadPyodide: (config: any) => Promise<any>;
  }
}
let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = window.loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
  });
  pyodideInstance = await pyodideLoadingPromise;
  pyodideLoadingPromise = null;
  return pyodideInstance;
}

const mimeTypeMap: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'csv': 'text/csv',
    'txt': 'text/plain',
    'json': 'application/json',
    'html': 'text/html',
};


export async function executePythonWithPyodide(code: string, packages: string[] = []): Promise<string> {
  const py = await getPyodide();
  let capturedStdout = '';
  let finalResult: any;
  py.setStdout({ batched: (str: string) => capturedStdout += str + '\n' });
  py.setStderr({ batched: (str: string) => capturedStdout += `[STDERR] ${str}\n` });

  try {
    if (packages && packages.length > 0) {
      await py.loadPackage('micropip');
      const micropip = py.pyimport('micropip');
      capturedStdout += `Installing packages: ${packages.join(', ')}...\n`;
      await micropip.install(packages);
      capturedStdout += `Packages installed successfully.\n---\n`;
    }

    py.FS.mkdirTree('/main/output');

    finalResult = await py.runPythonAsync(code);
    
    // Check if the final result is HTML content to be rendered visually
    const resultIsHtml = typeof finalResult === 'string' && finalResult.trim().match(/^(<!DOCTYPE html>|<html>)/i);
    
    if (resultIsHtml) {
        const componentId = `code-output-${generateId()}`;
        const componentData = {
            outputId: componentId,
            htmlOutput: finalResult,
            textOutput: capturedStdout.trim(),
        };
        return `[CODE_OUTPUT_COMPONENT]${JSON.stringify(componentData)}[/CODE_OUTPUT_COMPONENT]`;
    }

    // If not HTML, append the string representation of the result to stdout
    if (finalResult !== undefined && finalResult !== null) {
      capturedStdout += String(finalResult);
    }
    
    const attachmentLinks: string[] = [];
    const files = py.FS.readdir('/main/output');
    if (files) {
      for (const filename of files) {
        if (filename === '.' || filename === '..') continue;
        
        try {
          const filePath = `/main/output/${filename}`;
          const fileData: Uint8Array = py.FS.readFile(filePath);

          const extension = filename.split('.').pop()?.toLowerCase() || '';
          const mimeType = mimeTypeMap[extension] || 'application/octet-stream';
          
          const blob = new Blob([fileData], { type: mimeType });

          const fileKey = await fileStore.saveFile(blob);
          
          const attachmentData = { filename, fileKey, mimeType };
          attachmentLinks.push(`[FILE_ATTACHMENT_COMPONENT]${JSON.stringify(attachmentData)}[/FILE_ATTACHMENT_COMPONENT]`);
          
          py.FS.unlink(filePath);
        } catch (fileError) {
          console.error(`Error processing file ${filename} from virtual FS:`, fileError);
          capturedStdout += `\n[ERROR] Failed to process output file '${filename}'.`;
        }
      }
    }
    
    let finalOutput = capturedStdout.trim() || 'Code executed successfully with no output.';
    if (attachmentLinks.length > 0) {
      finalOutput += `\n\n${attachmentLinks.join('\n')}`;
    }

    return finalOutput;

  } catch (error) {
    const err = error as Error;
    return `Execution failed:\n${err.message}`;
  } finally {
    py.setStdout({});
    py.setStderr({});
    // Clean up created directories
    try {
        if (py.FS.analyzePath('/main/output').exists) {
            const files = py.FS.readdir('/main/output');
            for (const file of files) {
                if (file !== '.' && file !== '..') {
                    py.FS.unlink(`/main/output/${file}`);
                }
            }
            py.FS.rmdir('/main/output');
        }
        if (py.FS.analyzePath('/main').exists) {
            py.FS.rmdir('/main');
        }
    } catch(e) {
        console.warn("Error during virtual directory cleanup:", e);
    }
  }
}