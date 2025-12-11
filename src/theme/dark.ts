
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const darkTheme = {
  // --- Base Layers (Modern Zinc) ---
  "--bg-page": "#09090b", // Zinc 950 - Rich, warm black
  "--bg-layer-1": "#18181b", // Zinc 900 - Soft card background
  "--bg-layer-2": "#27272a", // Zinc 800 - Borders/Separators
  "--bg-layer-3": "#3f3f46", // Zinc 700 - Hover states
  "--bg-glass": "rgba(24, 24, 27, 0.8)", // Glassmorphism base

  // --- Text Colors (High Contrast) ---
  "--text-primary": "#fafafa", // Zinc 50
  "--text-secondary": "#a1a1aa", // Zinc 400
  "--text-tertiary": "#71717a", // Zinc 500
  "--text-inverted": "#000000",

  // --- Borders (Subtle & Refined) ---
  "--border-subtle": "rgba(255, 255, 255, 0.05)",
  "--border-default": "rgba(255, 255, 255, 0.08)",
  "--border-strong": "rgba(255, 255, 255, 0.15)",
  "--border-focus": "#6366f1", // Indigo 500

  // --- Brand Colors (Electric Indigo) ---
  "--primary-main": "#6366f1", // Indigo 500
  "--primary-hover": "#818cf8", // Indigo 400
  "--primary-subtle": "rgba(99, 102, 241, 0.15)", // Glow effect
  "--primary-text": "#e0e7ff", // Indigo 50

  // --- Status Indicators (Vibrant Glass) ---
  "--status-error-bg": "rgba(127, 29, 29, 0.2)",
  "--status-error-text": "#fca5a5",
  "--status-success-bg": "rgba(20, 83, 45, 0.2)",
  "--status-success-text": "#86efac",
  "--status-warning-bg": "rgba(113, 63, 18, 0.2)",
  "--status-warning-text": "#fde047",

  // --- Component Specifics ---
  "--bg-message-user": "#27272a", // Matches layer 2
  "--bg-message-ai": "transparent",
  "--bg-input": "#18181b", // Matches layer 1
  "--bg-input-secondary": "#27272a",
  "--bg-code": "#121214", // Deep black for code blocks
  "--text-code": "#e4e4e7",
  "--bg-sidebar": "#09090b" // Matches page
};

export default darkTheme;
