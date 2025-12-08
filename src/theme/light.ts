
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const lightTheme = {
  // --- Base Layers ---
  "--bg-page": "#F0F4F8", // Cool gray-blue tint for depth
  "--bg-layer-1": "rgba(255, 255, 255, 0.85)", // High opacity glass
  "--bg-layer-2": "#E2E8F0", // Slate-200
  "--bg-layer-3": "#CBD5E1", // Slate-300
  "--bg-glass": "rgba(255, 255, 255, 0.6)",

  // --- Text Colors ---
  "--text-primary": "#1E293B", // Slate-800
  "--text-secondary": "#475569", // Slate-600
  "--text-tertiary": "#94A3B8", // Slate-400
  "--text-inverted": "#FFFFFF",

  // --- Borders ---
  "--border-subtle": "rgba(99, 102, 241, 0.1)", // Indigo tint
  "--border-default": "rgba(99, 102, 241, 0.15)",
  "--border-strong": "rgba(99, 102, 241, 0.25)",
  "--border-focus": "#8B5CF6", // Violet

  // --- Brand Colors (Vibrant Gradient Bases) ---
  "--primary-main": "#6366F1", // Indigo-500
  "--primary-hover": "#4F46E5", // Indigo-600
  "--primary-subtle": "#EEF2FF", // Indigo-50
  "--primary-text": "#312E81", // Indigo-900

  // --- Status Indicators ---
  "--status-error-bg": "#FEF2F2",
  "--status-error-text": "#EF4444",
  "--status-success-bg": "#F0FDF4",
  "--status-success-text": "#10B981",
  "--status-warning-bg": "#FEFCE8",
  "--status-warning-text": "#F59E0B",

  // --- Component Specifics ---
  "--bg-message-user": "#6366F1", // Used as fallback or base for gradients
  "--bg-message-ai": "transparent",
  "--bg-input": "rgba(255, 255, 255, 0.9)",
  "--bg-input-secondary": "#F8FAFC",
  "--bg-code": "#F1F5F9",
  "--text-code": "#0F172A",
  "--bg-sidebar": "rgba(241, 245, 249, 0.85)"
};

export default lightTheme;
