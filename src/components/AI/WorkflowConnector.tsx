/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// FIX: Cast `motion` to `any` to bypass framer-motion typing issues.
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

type WorkflowConnectorProps = {
  isActive: boolean;
};

export const WorkflowConnector = ({ isActive }: WorkflowConnectorProps) => {
  return (
    <div className="h-full w-5 flex justify-center -my-2" aria-hidden="true">
      <svg width="2" height="100%" viewBox="0 0 2 64" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M1 0V64" stroke="currentColor" className="text-ui-200" strokeWidth="2"/>
        <defs>
            <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0"/>
                <stop offset="50%" stopColor="rgb(var(--primary))" stopOpacity="1"/>
                <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0"/>
            </linearGradient>
        </defs>
        {isActive && (
          <motion.path
            d="M1 0V64"
            stroke="url(#glow)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        )}
      </svg>
    </div>
  );
};