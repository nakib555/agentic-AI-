/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

type WorkflowConnectorProps = {
  isActive: boolean;
};

export const WorkflowConnector = ({ isActive }: WorkflowConnectorProps) => {
  return (
    <div className="h-full w-5 flex justify-center" aria-hidden="true">
      <svg width="2" height="100%" viewBox="0 0 2 32" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M1 0V32" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" />
        {isActive && (
          <motion.path
            d="M1 0V32"
            stroke="currentColor"
            className="text-blue-500 dark:text-blue-400"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}
      </svg>
    </div>
  );
};
