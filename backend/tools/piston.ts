
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError';

// This is the backend implementation for executing code via the Piston API.
// It acts as a proxy, hiding the API endpoint from the client.

const pistonLanguageMap: Record<string, string> = {
  awk: 'awk', bash: 'bash', sh: 'bash', brainfuck: 'brainfuck', bf: 'brainfuck', c: 'c', cpp: 'cpp', 'c++': 'cpp', csharp: 'csharp', 'c#': 'csharp', cobol: 'cobol', crystal: 'crystal', dart: 'dart', deno: 'deno', elixir: 'elixir', emacs: 'emacs', el: 'emacs', erlang: 'erlang', fortran: 'fortran', go: 'go', golang: 'go', golfscript: 'golfscript', groovy: 'groovy', haskell: 'haskell', hs: 'haskell', java: 'java', julia: 'julia', jl: 'julia', kotlin: 'kotlin', kt: 'kotlin', lisp: 'lisp', lua: 'lua', nasm: 'nasm', nim: 'nim', ocaml: 'ocaml', octave: 'octave', pascal: 'pascal', perl: 'perl', php: 'php', powershell: 'powershell', ps1: 'powershell', r: 'r', ruby: 'ruby', rb: 'ruby', rust: 'rust', rs: 'scala', scala: 'scala', swift: 'swift', zig: 'zig',
};

export async function executeWithPiston(language: string, code: string): Promise<string> {
    const pistonLanguage = pistonLanguageMap[language.toLowerCase()];
    if (!pistonLanguage) {
      console.error(`[Piston Error] Unsupported language: ${language}`);
      throw new ToolError('executeCode', 'UNSUPPORTED_LANGUAGE', `Language "${language}" is not supported by the fallback execution engine.`);
    }
  
    try {
      console.log(`[Piston Request] Executing ${language} code...`);
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pistonLanguage,
          version: '*',
          files: [{ content: code }],
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
  
      if (error) {
          console.warn(`[Piston Execution Stderr]`, error);
          return `Execution failed:\n${error}`;
      }
      return output.trim() || 'Code executed successfully with no output.';
    } catch (error) {
      console.error(`[Piston Fatal] Execution failed for ${language}`, error);
      const originalError = error instanceof Error ? error : new Error(String(error));
      throw new ToolError('executeCode', 'PISTON_API_ERROR', originalError.message, originalError);
    }
}
