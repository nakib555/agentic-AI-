
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const darkTheme = {
  // --- Base Layers (Premium Dark) ---
  "--bg-page": "#09090b",       // Deepest Zinc (almost black)
  "--bg-layer-1": "#18181b",    // Zinc 900 (Surface for cards/sidebar)
  "--bg-layer-2": "#27272a",    // Zinc 800 (Hover states, inputs)
  "--bg-layer-3": "#3f3f46",    // Zinc 700 (Active states)
  "--bg-glass": "rgba(24, 24, 27, 0.75)", // Translucent Zinc 900

  // --- Text Colors (Crisp & Readable) ---
  "--text-primary": "#fafafa",  // Zinc 50 (High emphasis)
  "--text-secondary": "#a1a1aa", // Zinc 400 (Medium emphasis)
  "--text-tertiary": "#71717a",  // Zinc 500 (Low emphasis)
  "--text-inverted": "#09090b",  // Zinc 950 (Text on light backgrounds)

  // --- Borders (Subtle & Refined) ---
  "--border-subtle": "rgba(255, 255, 255, 0.05)",
  "--border-default": "rgba(255, 255, 255, 0.1)",
  "--border-strong": "rgba(255, 255, 255, 0.18)",
  "--border-focus": "#6366f1",   // Indigo 500

  // --- Brand Colors (Vibrant Indigo) ---
  "--primary-main": "#6366f1",   // Indigo 500
  "--primary-hover": "#818cf8",  // Indigo 400
  "--primary-subtle": "rgba(99, 102, 241, 0.15)", // Transparent Indigo
  "--primary-text": "#e0e7ff",   // Indigo 50

  // --- Status Indicators (Soft Neons) ---
  "--status-error-bg": "rgba(127, 29, 29, 0.3)",
  "--status-error-text": "#fca5a5", // Red 300
  "--status-success-bg": "rgba(20, 83, 45, 0.3)",
  "--status-success-text": "#86efac", // Green 300
  "--status-warning-bg": "rgba(113, 63, 18, 0.3)",
  "--status-warning-text": "#fde047", // Yellow 300

  // --- Component Specifics ---
  "--bg-message-user": "#27272a", // Zinc 800 (Distinct bubble)
  "--bg-message-ai": "transparent", 
  "--bg-input": "#18181b",        // Zinc 900
  "--bg-input-secondary": "#27272a", 
  "--bg-code": "#121212",         // Pitch black for code contrast
  "--text-code": "#e4e4e7",       // Zinc 200
  "--bg-sidebar": "#09090b"       // Matches page background
};

export default darkTheme;
