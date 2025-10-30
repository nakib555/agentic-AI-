/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../../types';

// --- Piston API (Fallback) Executor ---
const pistonLanguageMap: Record<string, string> = {
  awk: 'awk', bash: 'bash', sh: 'bash', brainfuck: 'brainfuck', bf: 'brainfuck', c: 'c', cpp: 'cpp', 'c++': 'cpp', csharp: 'csharp', 'c#': 'csharp', cobol: 'cobol', crystal: 'crystal', dart: 'dart', deno: 'deno', elixir: 'elixir', emacs: 'emacs', el: 'emacs', erlang: 'erlang', fortran: 'fortran', go: 'go', golang: 'go', golfscript: 'golfscript', groovy: 'groovy', haskell: 'haskell', hs: 'haskell', java: 'java', julia: 'julia', jl: 'julia', kotlin: 'kotlin', kt: 'kotlin', lisp: 'lisp', lua: 'lua', nasm: 'nasm', nim: 'nim', ocaml: 'ocaml', octave: 'octave', pascal: 'pascal', perl: 'perl', php: 'php', powershell: 'powershell', ps1: 'powershell', r: 'r', ruby: 'ruby', rb: 'ruby', rust: 'rust', rs: 'rust', scala: 'scala', swift: 'swift', zig: 'zig',
};

export async function executeWithPiston(language: string, code: string): Promise<string> {
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
