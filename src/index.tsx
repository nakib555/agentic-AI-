
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Explicitly point to the index file to avoid any ambiguity with the deprecated App.tsx
import { App } from './components/App/index';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logCollector } from './utils/logCollector';

// Start logging immediately to capture startup events
logCollector.start();

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>
);
