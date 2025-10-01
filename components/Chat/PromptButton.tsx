/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type PromptButtonProps = {
    icon: string;
    text: string;
    onClick: () => void;
};

export const PromptButton = ({ icon, text, onClick }: PromptButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/60 hover:bg-white/80 dark:bg-slate-700/60 dark:hover:bg-slate-700/80 transition-colors rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
    >
        {icon}
        <span className="hidden sm:inline">{text}</span>
    </button>
);
