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
        className="group flex items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-slate-700 transition-all hover:bg-white/90 dark:border-white/10 dark:bg-black/20 dark:text-slate-300 dark:hover:bg-black/40"
    >
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{text}</span>
    </button>
);