/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TabButton } from '../UI/TabButton';

type CodeExecutionResultProps = {
  outputId: string;
  htmlOutput: string;
  textOutput: string;
};

export const CodeExecutionResult: React.FC<CodeExecutionResultProps> = ({ outputId, htmlOutput, textOutput }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'text'>('visual');

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-lg bg-white dark:bg-[#1e1e1e]">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-gray-200 dark:border-slate-700 px-2 bg-gray-50 dark:bg-black/20">
        <TabButton label="Visual Output" isActive={activeTab === 'visual'} onClick={() => setActiveTab('visual')} />
        <TabButton label="Text Logs" isActive={activeTab === 'text'} onClick={() => setActiveTab('text')} />
      </div>

      {/* Tab Content */}
      <div className="relative">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-2"
          >
            {activeTab === 'visual' ? (
              <div id={outputId} className="w-full bg-white dark:bg-[#121212]">
                <iframe
                  srcDoc={htmlOutput}
                  className="w-full h-96 border-none"
                  sandbox="allow-scripts" // Sandboxed for security
                  title="Code Execution Visual Output"
                />
              </div>
            ) : (
              <pre className="p-4 bg-gray-100 dark:bg-black/30 rounded-lg text-xs font-mono text-gray-700 dark:text-slate-300 whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
                <code>{textOutput || 'No text output was generated.'}</code>
              </pre>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
