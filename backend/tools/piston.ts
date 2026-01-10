
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError';

// This is the backend implementation for executing code via the Piston API.
// It acts as a proxy, hiding the API endpoint from the client.
// We use the official free EMKC endpoint: https://emkc.org/api/v2/piston/execute

const PISTON_API_ENDPOINT = 'https://emkc.org/api/v2/piston/execute';

const pistonLanguageMap: Record<string, string> = {
  awk: 'awk', bash: 'bash', sh: 'bash', brainfuck: 'brainfuck', bf: 'brainfuck', 
  c: 'c', cpp: 'cpp', 'c++': 'cpp', csharp: 'csharp', 'c#': 'csharp', 
  cobol: 'cobol', crystal: 'crystal', dart: 'dart', deno: 'deno', 
  elixir: 'elixir', emacs: 'emacs', el: 'emacs', erlang: 'erlang', 
  fortran: 'fortran', go: 'go', golang: 'go', golfscript: 'golfscript', 
  groovy: 'groovy', haskell: 'haskell', hs: 'haskell', java: 'java', 
  julia: 'julia', jl: 'julia', kotlin: 'kotlin', kt: 'kotlin', 
  lisp: 'lisp', lua: 'lua', nasm: 'nasm', nim: 'nim', ocaml: 'ocaml', 
  octave: 'octave', pascal: 'pascal', perl: 'perl', php: 'php', 
  powershell: 'powershell', ps1: 'powershell', r: 'r', ruby: 'ruby', 
  rb: 'ruby', rust: 'rust', rs: 'rust', scala: 'scala', swift: 'swift', 
  zig: 'zig', python: 'python', py: 'python', 
  javascript: 'javascript', js: 'javascript', 
  typescript: 'typescript', ts: 'typescript',
};

type PistonFile = {
    name?: string;
    content: string;
};

// Now accepts either a single code string (legacy) or an array of files
export async function executeWithPiston(language: string, input: string | PistonFile[]): Promise<string> {
    const normalizedLang = language.toLowerCase();
    const pistonLanguage = pistonLanguageMap[normalizedLang];
    
    if (!pistonLanguage) {
      console.error(`[Piston Error] Unsupported language: ${language}`);
      throw new ToolError('executeCode', 'UNSUPPORTED_LANGUAGE', `Language "${language}" is not supported by the execution engine.`);
    }
  
    // Prepare files payload
    let files: PistonFile[] = [];
    if (typeof input === 'string') {
        files = [{ content: input }];
    } else {
        files = input;
    }

    try {
      console.log(`[Piston Request] Executing ${pistonLanguage} code via ${PISTON_API_ENDPOINT}...`);
      
      const response = await fetch(PISTON_API_ENDPOINT, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            // No Authorization header needed for the free tier
        },
        body: JSON.stringify({
          language: pistonLanguage,
          version: '*', // Use the latest available version
          files: files,
        }),
      });
  
      if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Piston API Error] Status: ${response.status}, Cause: ${errorText}`);
          throw new Error(`Piston API request failed with status ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`[Piston Success] Execution completed.`);
      
      const output = result.run?.stdout || '';
      const error = result.run?.stderr || '';
  
      // Combine stdout and stderr for full context
      if (error) {
          // If there is output, show it alongside the error
          if (output) {
              return `Execution output:\n${output}\n\nExecution errors:\n${error}`;
          }
          return `Execution errors:\n${error}`;
      }
      
      return output.trim() || 'Code executed successfully with no output.';
    } catch (error) {
      console.error(`[Piston Fatal] Execution failed for ${language}`, error);
      const originalError = error instanceof Error ? error : new Error(String(error));
      
      // Improve error message for common network issues
      let message = originalError.message;
      if (message.includes('fetch')) {
          message = "Failed to connect to the execution service. The Piston API might be down or unreachable.";
      }
      
      throw new ToolError('executeCode', 'PISTON_API_ERROR', message, originalError);
    }
}
