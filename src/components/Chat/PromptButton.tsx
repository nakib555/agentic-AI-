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
        className="flex items-center gap-2 px-3 py-1.5 bg-white/60 hover:bg-white/90 dark:bg-black/20 dark:hover:bg-black/40 transition-colors rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10"
    >
        {icon}
        <span className="hidden sm:inline font-medium">{text}</span>
    </button>
);