/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, Variants } from 'framer-motion';
import type { Source } from '../../types';

type SourcesPillsProps = {
  sources: Source[];
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

const PillContent: React.FC<{ source: Source, index: number }> = ({ source, index }) => {
    let domain: string | null = null;
    try {
        domain = new URL(source.uri).hostname;
    } catch (error) {
        console.warn(`Invalid source URI encountered: "${source.uri}"`);
    }

    return (
      <a href={source.uri} target="_blank" rel="noopener noreferrer" title={source.title}>
        {domain && (
            <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                alt={`Favicon for ${domain}`}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 bg-white dark:bg-gray-800"
                style={{ zIndex: 3 - index }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
        )}
      </a>
    );
};


export const SourcesPills: React.FC<SourcesPillsProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
            {sources.slice(0, 3).map((source, index) => (
                <PillContent key={source.uri} source={source} index={index} />
            ))}
        </div>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Sources</span>
    </div>
  );
};