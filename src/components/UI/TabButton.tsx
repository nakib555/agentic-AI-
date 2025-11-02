/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

type TabButtonProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

export const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`relative px-3 py-2 text-sm font-semibold transition-colors focus:outline-none ${
      isActive
        ? 'text-primary'
        : 'text-text-muted hover:text-text-primary'
    }`}
    aria-selected={isActive}
  >
    {label}
    {isActive && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        layoutId="tab-underline"
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    )}
  </button>
);