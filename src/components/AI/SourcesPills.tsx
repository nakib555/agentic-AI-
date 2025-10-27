/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, Variants } from 'framer-motion';
import type { Source } from '../../../types';

type SourcesPillsProps = {
  sources: Source[];
};

const pillVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// A regular component that returns the inner content of a pill.
const PillContent: React.FC<{ source: Source }> = ({ source }) => {
    let domain: string | null = null;
    try {
        domain = new URL(source.uri).hostname;
    } catch (error) {
        console.warn(`Invalid source URI encountered: "${source.uri}"`);
    }

    return (
        <>
            {domain && (
                <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                    alt=""
                    className="w-4 h-4 rounded-sm"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            )}
            <span className="truncate">{source.title}</span>
        </>
    );
};


// FIX: Changed component signature to use React.FC to resolve a TypeScript error with the 'key' prop.
export const SourcesPills: React.FC<SourcesPillsProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Sources</h4>
      <motion.div
        className="flex flex-wrap gap-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sources.map((source, index) => (
          <motion.a
            key={index}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            title={`Visit source: ${source.title}`}
            variants={pillVariants}
          >
            <PillContent source={source} />
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
};