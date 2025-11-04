/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook to manage the state of the Chat/Agent mode toggle,
 * including persistence to localStorage.
 */
export const useModeToggle = () => {
  // Initialize state from localStorage, defaulting to Agent mode (true).
  const [isAgentMode, setIsAgentMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('agentic-isAgentMode');
    return saved ? JSON.parse(saved) : true;
  });

  // Persist state to localStorage whenever it changes.
  useEffect(() => {
    localStorage.setItem('agentic-isAgentMode', JSON.stringify(isAgentMode));
  }, [isAgentMode]);

  return {
    isAgentMode,
    setIsAgentMode,
  };
};
