
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const darkTheme = {
  // --- Base Layers (High Contrast Zinc) ---
  "--bg-page": "#09090b",       // Zinc 950
  "--bg-layer-1": "#18181b",    // Zinc 900
  "--bg-layer-2": "#27272a",    // Zinc 800
  "--bg-layer-3": "#3f3f46",    // Zinc 700
  "--bg-glass": "rgba(9, 9, 11, 0.9)", // Less transparency for better readability

  // --- Text Colors (High Contrast) ---
  "--text-primary": "#ffffff",  // Pure White
  "--text-secondary": "#e4e4e7", // Zinc 200 (Significantly lighter than Zinc 400)
  "--text-tertiary": "#a1a1aa",  // Zinc 400
  "--text-inverted": "#000000",

  // --- Borders (Visible & Distinct) ---
  "--border-subtle": "rgba(255, 255, 255, 0.1)",
  "--border-default": "rgba(255, 255, 255, 0.15)", // Increased opacity
  "--border-strong": "rgba(255, 255, 255, 0.25)",
  "--border-focus": "#818cf8",   // Indigo 400

  // --- Brand Colors (Vibrant) ---
  "--primary-main": "#6366f1",   // Indigo 500
  "--primary-hover": "#818cf8",  // Indigo 400
  "--primary-subtle": "rgba(99, 102, 241, 0.25)", // More visible tint
  "--primary-text": "#ffffff",   

  // --- Status Indicators (High Vis) ---
  "--status-error-bg": "rgba(239, 68, 68, 0.2)",
  "--status-error-text": "#fca5a5", 
  "--status-success-bg": "rgba(34, 197, 94, 0.2)",
  "--status-success-text": "#86efac", 
  "--status-warning-bg": "rgba(234, 179, 8, 0.2)",
  "--status-warning-text": "#fde047", 

  // --- Component Specifics ---
  "--bg-message-user": "#27272a", // Zinc 800
  "--bg-message-ai": "transparent", 
  "--bg-input": "#18181b",        // Zinc 900
  "--bg-input-secondary": "#27272a", 
  "--bg-code": "#111113",         // Darker than layer-1
  "--text-code": "#f4f4f5",       // Zinc 100
  "--bg-sidebar": "#09090b"
};

export default darkTheme;
