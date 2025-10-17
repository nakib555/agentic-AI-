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
        className="group flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/60 p-2 text-center text-slate-700 transition-all hover:bg-white/90 dark:border-white/10 dark:bg-black/20 dark:text-slate-300 dark:hover:bg-black/40 sm:p-4 sm:gap-3"
    >
        <span className="transform text-2xl transition-transform duration-200 group-hover:scale-110 sm:text-3xl">{icon}</span>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">{text}</span>
    </button>
);