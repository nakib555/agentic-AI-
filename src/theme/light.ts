
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const lightTheme = {
  // --- Base Layers ---
  "--bg-page": "#F8FAFC", // Slate-50 - softer than pure white
  "--bg-layer-1": "rgba(255, 255, 255, 0.8)", // Glassy white
  "--bg-layer-2": "#F1F5F9", // Slate-100
  "--bg-layer-3": "#E2E8F0", // Slate-200
  "--bg-glass": "rgba(255, 255, 255, 0.7)",

  // --- Text Colors ---
  "--text-primary": "#0F172A", // Slate-900
  "--text-secondary": "#475569", // Slate-600
  "--text-tertiary": "#94A3B8", // Slate-400
  "--text-inverted": "#FFFFFF",

  // --- Borders ---
  "--border-subtle": "rgba(148, 163, 184, 0.1)",
  "--border-default": "rgba(148, 163, 184, 0.2)",
  "--border-strong": "rgba(148, 163, 184, 0.4)",
  "--border-focus": "#6366f1",

  // --- Brand Colors ---
  "--primary-main": "#4F46E5", // Indigo-600
  "--primary-hover": "#4338CA", // Indigo-700
  "--primary-subtle": "#EEF2FF", // Indigo-50
  "--primary-text": "#312E81", // Indigo-900

  // --- Status Indicators ---
  "--status-error-bg": "#FEF2F2",
  "--status-error-text": "#DC2626",
  "--status-success-bg": "#F0FDF4",
  "--status-success-text": "#16A34A",
  "--status-warning-bg": "#FEFCE8",
  "--status-warning-text": "#CA8A04",

  // --- Component Specifics ---
  "--bg-message-user": "#4F46E5", // Brand color for user bubbles
  "--bg-message-ai": "transparent",
  "--bg-input": "rgba(255, 255, 255, 0.8)",
  "--bg-input-secondary": "#F8FAFC",
  "--bg-code": "#F1F5F9",
  "--text-code": "#1E293B",
  "--bg-sidebar": "rgba(248, 250, 252, 0.8)" // Translucent sidebar
};

export default lightTheme;
