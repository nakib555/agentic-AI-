/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../../types';

// --- Web Worker (JavaScript) Executor ---
export async function executeJsInWorker(code: string, cdn_urls: string[] = []): Promise<string> {
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
