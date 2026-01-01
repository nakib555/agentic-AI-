
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const darkTheme = {
  // --- Base Layers (Modern Midnight/Zinc) ---
  "--bg-page": "#09090b",       // Zinc 950 - Deep, rich background
  "--bg-layer-1": "#18181b",    // Zinc 900 - Subtle card surface
  "--bg-layer-2": "#27272a",    // Zinc 800 - Hover states & Inputs
  "--bg-layer-3": "#3f3f46",    // Zinc 700 - Active states
  "--bg-glass": "rgba(9, 9, 11, 0.7)", // Deep translucent blur

  // --- Text Colors (Refined Contrast) ---
  "--text-primary": "#fafafa",  // Zinc 50 - Sharpest text
  "--text-secondary": "#a1a1aa", // Zinc 400 - Muted text
  "--text-tertiary": "#71717a",  // Zinc 500 - Subtler details
  "--text-inverted": "#000000",  // Black text on primary buttons

  // --- Borders (Ultra-thin & Subtle) ---
  "--border-subtle": "rgba(255, 255, 255, 0.04)",
  "--border-default": "rgba(255, 255, 255, 0.08)",
  "--border-strong": "rgba(255, 255, 255, 0.15)",
  "--border-focus": "#6366f1",   // Indigo 500 ring

  // --- Brand Colors (Vibrant Indigo) ---
  "--primary-main": "#6366f1",   // Indigo 500
  "--primary-hover": "#818cf8",  // Indigo 400 (Lighter on hover for dark mode)
  "--primary-subtle": "rgba(99, 102, 241, 0.15)", // Transparent Indigo tint
  "--primary-text": "#e0e7ff",   // Indigo 50

  // --- Status Indicators (Pastel Neons) ---
  "--status-error-bg": "rgba(127, 29, 29, 0.3)",
  "--status-error-text": "#fca5a5", // Red 300
  "--status-success-bg": "rgba(20, 83, 45, 0.3)",
  "--status-success-text": "#86efac", // Green 300
  "--status-warning-bg": "rgba(113, 63, 18, 0.3)",
  "--status-warning-text": "#fde047", // Yellow 300

  // --- Component Specifics ---
  "--bg-message-user": "#27272a", // Zinc 800 bubble
  "--bg-message-ai": "transparent", 
  "--bg-input": "#18181b",        // Zinc 900
  "--bg-input-secondary": "#27272a", 
  "--bg-code": "#121214",         // Almost black for code blocks
  "--text-code": "#e4e4e7",       // Zinc 200
  "--bg-sidebar": "#09090b"       // Seamless sidebar
};

export default darkTheme;
