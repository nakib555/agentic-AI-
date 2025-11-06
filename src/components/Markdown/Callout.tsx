/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export type CalloutType = 'note' | 'tip' | 'info' | 'warning' | 'danger';

const ICONS: Record<CalloutType, React.ReactNode> = {
  note: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.58 6.518a.75.75 0 0 0-1.16.034L6.044 9.33a.75.75 0 0 0 .598 1.173h.001l.002-.001.002-.001h.001L6.7 10.5h6.6a.75.75 0 0 0 .75-.75V9a.75.75 0 0 0-.75-.75h-3.091l-1.05-1.732Z" clipRule="evenodd" /></svg>,
  tip: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2Z" /><path fillRule="evenodd" d="M4.603 4.603a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM13.28 5.663a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM2 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 2 10ZM15.25 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM4.603 15.397a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0ZM13.28 14.337a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 17a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5H10.75a.75.75 0 0 1-.75-.75Z" /><path d="M7 10a3 3 0 0 1 3-3h.01a3 3 0 0 1 3 3c0 1.383-1.118 2.753-1.84 3.474a.75.75 0 0 1-1.06 0C9.368 12.953 8.25 11.583 8.25 10.2c0-.124.015-.245.042-.365a.75.75 0 0 1 1.458-.232A1.5 1.5 0 0 0 10 11.5c.013 0 .025 0 .038-.002a.75.75 0 0 1 .722.752A2.492 2.492 0 0 0 12.5 10a2.5 2.5 0 0 0-2.5-2.5h-.01a2.5 2.5 0 0 0-2.5 2.5c0 .339.074.664.21.962a.75.75 0 0 1-1.39.576A4.5 4.5 0 0 1 7 10Z" /></svg>,
  info: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>,
  warning: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>,
  danger: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>,
};

const STYLES: Record<CalloutType, { container: string; icon: string; title: string }> = {
  note: {
    container: 'bg-sky-50 dark:bg-sky-900/30 border-sky-500/50',
    icon: 'text-sky-600 dark:text-sky-400',
    title: 'text-sky-800 dark:text-sky-200',
  },
  tip: {
    container: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-800 dark:text-emerald-200',
  },
  info: {
    container: 'bg-slate-100 dark:bg-slate-800/50 border-slate-500/50',
    icon: 'text-slate-600 dark:text-slate-400',
    title: 'text-slate-800 dark:text-slate-200',
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-900/30 border-amber-500/50',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-200',
  },
  danger: {
    container: 'bg-red-50 dark:bg-red-900/30 border-red-500/50',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
  },
};

export const Callout = ({ type, title, children, compact }: { type: CalloutType; title?: string; children: React.ReactNode; compact?: boolean }) => {
  const styles = STYLES[type] || STYLES.info;
  const icon = ICONS[type] || ICONS.info;

  return (
    <div className={`${compact ? 'my-2 p-3' : 'my-4 p-4'} rounded-lg border-l-4 ${styles.container}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 pt-0.5 ${styles.icon}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          {title && <h4 className={`text-sm font-bold mb-1 ${styles.title}`}>{title}</h4>}
          <div className="callout-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
