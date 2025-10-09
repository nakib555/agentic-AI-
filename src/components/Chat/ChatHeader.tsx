/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React from 'react';
import { ModelSelector } from '../UI/ModelSelector';
import type { Model } from '../../services/modelService';

type ChatHeaderProps = {
  setIsSidebarOpen: (isOpen: boolean) => void;
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled: boolean;
};

export const ChatHeader = ({ setIsSidebarOpen, models, selectedModel, onModelChange, disabled }: ChatHeaderProps) => (
  <header className="py-4 px-4 sm:px-6 md:px-8 flex items-center justify-between md:justify-end">
      {/* Hamburger Menu for Mobile */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        aria-label="Open sidebar"
        title="Open sidebar"
      >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
      </button>

      <ModelSelector 
          models={models}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          disabled={disabled}
      />
  </header>
);
