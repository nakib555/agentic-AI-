/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './components/App/index';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#121212]"><div className="w-10 h-10 border-4 border-t-transparent border-teal-500 rounded-full animate-spin"></div></div>}>
    <App />
  </React.Suspense>
);