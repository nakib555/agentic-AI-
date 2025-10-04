/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 pb-16">
        <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-300 via-blue-300 to-green-200 opacity-50 blur-xl"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-teal-400 via-blue-400 to-green-300 opacity-60 blur-lg"></div>
            <div className="absolute inset-4 rounded-full bg-white/80 dark:bg-slate-800/80"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-teal-600 dark:text-teal-400 select-none">G</span>
            </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">How can I help you today, <span className="text-teal-600 dark:text-teal-400">darling</span>? ❤️</h1>
    </div>
);