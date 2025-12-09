
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const darkTheme = {
  // --- Base Layers (Midnight Obsidian) ---
  "--bg-page": "#050505", // Deep void black
  "--bg-layer-1": "#121212", // Rich obsidian panel
  "--bg-layer-2": "#1c1c1c", // Slightly lighter for nesting
  "--bg-layer-3": "#262626", // Tertiary/Hover states
  "--bg-glass": "rgba(18, 18, 18, 0.8)", // Glassmorphism base

  // --- Text Colors (High Clarity) ---
  "--text-primary": "#EDEDED", // Off-white (softer on eyes than #FFF)
  "--text-secondary": "#A1A1AA", // Zinc 400
  "--text-tertiary": "#52525B", // Zinc 600
  "--text-inverted": "#000000",

  // --- Borders (Subtle & Refined) ---
  "--border-subtle": "rgba(255, 255, 255, 0.04)",
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
  "--bg-message-user": "#1c1c1c", // Matches layer 2
  "--bg-message-ai": "transparent",
  "--bg-input": "#121212", // Matches layer 1
  "--bg-input-secondary": "#1c1c1c",
  "--bg-code": "#0a0a0a", // Deep black for code blocks
  "--text-code": "#e4e4e7",
  "--bg-sidebar": "#000000" // Pure black sidebar
};

export default darkTheme;
