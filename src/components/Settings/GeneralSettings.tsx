/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type GeneralSettingsProps = {
  onClearAllChats: () => void;
  onRunTests: () => void;
};

const SettingField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</label>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 mb-3">{description}</p>
        {children}
    </div>
);

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ onClearAllChats, onRunTests }) => {
  const handleClear = () => {
    if (window.confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
      onClearAllChats();
    }
  };
  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">General</h3>
      <SettingField 
        label="Clear all chats" 
        description="This will permanently delete all of your chat history."
      >
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Clear all chats
        </button>
      </SettingField>
      <SettingField 
        label="Run Diagnostic Tests" 
        description="Run a suite of automated tests to verify AI functionality, component rendering, and end-to-end response generation. This may take a few minutes."
      >
        <button
          onClick={onRunTests}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        >
          Run Diagnostic Tests
        </button>
      </SettingField>
    </div>
  );
};