
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const darkTheme = {
  // --- Base Layers ---
  "--bg-page": "#09090b", // Deepest background (Zinc-950)
  "--bg-layer-1": "#18181b", // Zinc-900
  "--bg-layer-2": "#27272a", // Zinc-800
  "--bg-layer-3": "#3f3f46", // Zinc-700
  "--bg-glass": "rgba(9, 9, 11, 0.85)", // Darker glass for better contrast

  // --- Text Colors ---
  "--text-primary": "#f2f2f2", // Almost white, softer than #fff
  "--text-secondary": "#a1a1aa", // Zinc-400
  "--text-tertiary": "#71717a", // Zinc-500
  "--text-inverted": "#000000",

  // --- Borders ---
  "--border-subtle": "rgba(255, 255, 255, 0.04)",
  "--border-default": "rgba(255, 255, 255, 0.08)",
  "--border-strong": "rgba(255, 255, 255, 0.15)",
  "--border-focus": "#6366f1", // Indigo-500

  // --- Brand Colors ---
  "--primary-main": "#6366f1", // Indigo-500
  "--primary-hover": "#818cf8", // Indigo-400
  "--primary-subtle": "rgba(99, 102, 241, 0.1)",
  "--primary-text": "#e0e7ff", // Indigo-100

  // --- Status Indicators ---
  "--status-error-bg": "rgba(220, 38, 38, 0.1)",
  "--status-error-text": "#fca5a5",
  "--status-success-bg": "rgba(22, 163, 74, 0.1)",
  "--status-success-text": "#86efac",
  "--status-warning-bg": "rgba(234, 179, 8, 0.1)",
  "--status-warning-text": "#fde047",

  // --- Component Specifics ---
  "--bg-message-user": "#18181b",
  "--bg-message-ai": "transparent", // Cleaner look without bubble background for AI
  "--bg-input": "#18181b", // Matches Layer 1
  "--bg-input-secondary": "#27272a",
  "--bg-code": "#121212", // Very dark for code blocks
  "--text-code": "#e4e4e7",
  "--bg-sidebar": "#09090b"
};

export default darkTheme;
