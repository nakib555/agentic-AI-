
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type ModeToggleProps = {
  isAgentMode: boolean;
  onToggle: (isAgent: boolean) => void;
  disabled: boolean;
};

export const ModeToggle: React.FC<ModeToggleProps> = () => {
  // Agent mode toggle removed.
  return null;
};
