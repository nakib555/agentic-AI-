/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";
import { ToolError } from '../../types';
import { fileStore } from '../services/fileStore';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const codeExecutorDeclaration: FunctionDeclaration = {
  name: 'executeCode',
  description: 'Executes code in a secure sandboxed environment. Supports Python, JavaScript, and other languages. For Python, it can install packages from PyPI and perform network requests. For JavaScript, it can import libraries from CDNs and perform network requests. For other languages, it uses a more restricted environment without networking or package installation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      language: {
        type: Type.STRING,
        description: 'The programming language of the code to execute.'
      },
      code: {
        type: Type.STRING,
        description: 'The code snippet to execute.'
      },
      packages: {
        type: Type.ARRAY,
        description: '(Python only) A list of PyPI packages to install before running the code (e.g., ["numpy", "pandas", "requests"]).',
        items: { type: Type.STRING }
      },
      cdn_urls: {
        type: Type.ARRAY,
        description: '(JavaScript only) A list of CDN URLs for external libraries to import before running the code.',
        items: { type: Type.STRING }
      }
    },
    required: ['language', 'code'],
  },
};

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


async function executePythonWithPyodide(code: string, packages: string[] = []): Promise<string> {
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


// --- Web Worker (JavaScript) Executor ---
async function executeJsInWorker(code: string, cdn_urls: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      const logs = [];
      const originalLog = console.log;
      const originalError = console.error;

      console.log = (...args) => {
        logs.push(args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' '));
        originalLog(...args);
      };
      console.error = (...args) => {
        logs.push('[STDERR] ' + args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' '));
        originalError(...args);
      };

      self.onmessage = async (event) => {
        const { code, cdn_urls } = event.data;

        try {
          if (cdn_urls && cdn_urls.length > 0) {
            importScripts(...cdn_urls);
          }

          // Use an async function to allow top-level await
          const result = await (async () => {
            return eval(code);
          })();
          
          if (result !== undefined) {
            logs.push(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
          }

          self.postMessage({ success: true, output: logs.join('\\n') });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (event) => {
      const { success, output, error } = event.data;
      if (success) {
        const resultText = output.trim() || 'Code executed successfully with no output.';
        const resultIsHtml = resultText.trim().match(/^(<!DOCTYPE html>|<html>)/i);
        if (resultIsHtml) {
            const componentId = `code-output-${Math.random().toString(36).substring(2, 9)}`;
            const componentData = {
                outputId: componentId,
                htmlOutput: resultText,
                textOutput: '', // JS worker logs are merged into the result, so this is empty.
            };
            resolve(`[CODE_OUTPUT_COMPONENT]${JSON.stringify(componentData)}[/CODE_OUTPUT_COMPONENT]`);
        } else {
            resolve(resultText);
        }
      } else {
        resolve(`Execution failed:\n${error}`);
      }
      worker.terminate();
      URL.revokeObjectURL(blob.toString());
    };

    worker.onerror = (error) => {
      reject(new ToolError('executeCode', 'WORKER_ERROR', error.message, new Error(error.message)));
      worker.terminate();
      URL.revokeObjectURL(blob.toString());
    };

    worker.postMessage({ code, cdn_urls });
  });
}

// --- Piston API (Fallback) Executor ---
const pistonLanguageMap: Record<string, string> = {
  awk: 'awk', bash: 'bash', sh: 'bash', brainfuck: 'brainfuck', bf: 'brainfuck', c: 'c', cpp: 'cpp', 'c++': 'cpp', csharp: 'csharp', 'c#': 'csharp', cobol: 'cobol', crystal: 'crystal', dart: 'dart', deno: 'deno', elixir: 'elixir', emacs: 'emacs', el: 'emacs', erlang: 'erlang', fortran: 'fortran', go: 'go', golang: 'go', golfscript: 'golfscript', groovy: 'groovy', haskell: 'haskell', hs: 'haskell', java: 'java', julia: 'julia', jl: 'julia', kotlin: 'kotlin', kt: 'kotlin', lisp: 'lisp', lua: 'lua', nasm: 'nasm', nim: 'nim', ocaml: 'ocaml', octave: 'octave', pascal: 'pascal', perl: 'perl', php: 'php', powershell: 'powershell', ps1: 'powershell', r: 'r', ruby: 'ruby', rb: 'ruby', rust: 'rust', rs: 'rust', scala: 'scala', swift: 'swift', zig: 'zig',
};

async function executeWithPiston(language: string, code: string): Promise<string> {
    const pistonLanguage = pistonLanguageMap[language.toLowerCase()];
    if (!pistonLanguage) {
      throw new ToolError('executeCode', 'UNSUPPORTED_LANGUAGE', `Language "${language}" is not supported by the fallback execution engine.`);
    }
  
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pistonLanguage,
          version: '*',
          files: [{ content: code }],
        }),
      });
  
      if (!response.ok) throw new Error(`Piston API request failed with status ${response.status}`);
      
      const result = await response.json();
      const output = result.run?.stdout || '';
      const error = result.run?.stderr || '';
  
      if (error) return `Execution failed:\n${error}`;
      return output.trim() || 'Code executed successfully with no output.';
    } catch (error) {
      const originalError = error instanceof Error ? error : new Error(String(error));
      throw new ToolError('executeCode', 'PISTON_API_ERROR', originalError.message, originalError);
    }
}

// --- Main Dispatcher ---
export const executeCode = async (args: { language: string; code: string; packages?: string[]; cdn_urls?: string[]; }): Promise<string> => {
  const { language, code, packages, cdn_urls } = args;
  const lang = language.toLowerCase();

  try {
    if (lang === 'python' || lang === 'py') {
      return await executePythonWithPyodide(code, packages);
    }

    if (lang === 'javascript' || lang === 'js' || lang === 'html') {
      return await executeJsInWorker(code, cdn_urls);
    }
    
    return await executeWithPiston(lang, code);
  } catch (error) {
    const originalError = error instanceof Error ? error : new Error(String(error));
    if (error instanceof ToolError) throw error; // Re-throw tool errors
    throw new ToolError('executeCode', 'EXECUTION_FAILED', originalError.message, originalError);
  }
};
