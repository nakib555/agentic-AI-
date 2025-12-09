/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const darkTheme = {
  // --- Base Layers ---
  "--bg-page": "#0a0a0a", // Deepest black-gray
  "--bg-layer-1": "#171717", // Neutral dark gray
  "--bg-layer-2": "#262626", // Slightly lighter
  "--bg-layer-3": "#404040", // Components/inputs
  "--bg-glass": "rgba(23, 23, 23, 0.8)",

  // --- Text Colors ---
  "--text-primary": "#ededed", // High contrast white-ish
  "--text-secondary": "#a1a1aa", // Muted gray
  "--text-tertiary": "#71717a", // Darker gray
  "--text-inverted": "#000000",

  // --- Borders ---
  "--border-subtle": "rgba(255, 255, 255, 0.06)",
  "--border-default": "rgba(255, 255, 255, 0.1)",
  "--border-strong": "rgba(255, 255, 255, 0.2)",
  "--border-focus": "#6366f1",

  // --- Brand Colors ---
  "--primary-main": "#6366f1", // Indigo-500
  "--primary-hover": "#818cf8", // Indigo-400
  "--primary-subtle": "rgba(99, 102, 241, 0.15)",
  "--primary-text": "#e0e7ff",

  // --- Status Indicators ---
  "--status-error-bg": "rgba(239, 68, 68, 0.1)",
  "--status-error-text": "#fca5a5",
  "--status-success-bg": "rgba(34, 197, 94, 0.1)",
  "--status-success-text": "#86efac",
  "--status-warning-bg": "rgba(234, 179, 8, 0.1)",
  "--status-warning-text": "#fde047",

  // --- Component Specifics ---
  "--bg-message-user": "#1e1e1e",
  "--bg-message-ai": "transparent",
  "--bg-input": "#171717",
  "--bg-input-secondary": "#262626",
  "--bg-code": "#111111", // darker code blocks
  "--text-code": "#e4e4e7",
  "--bg-sidebar": "#0a0a0a"
};

export default darkTheme;