/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Update import path for the App component to point to the correct barrel file, as the original component file was refactored and is now empty.
import { App } from './src/components/App/index';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);