
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const spockeTheme = {
  // --- Base Layers (True Void / High Contrast) ---
  "--bg-page": "#000000",        // True Black
  "--bg-layer-1": "#000000",     // True Black
  "--bg-layer-2": "#121212",     // Very Dark Gray
  "--bg-layer-3": "#262626",     // Dark Gray
  "--bg-glass": "#000000",       // Opaque black for max readability

  // --- Text Colors (Stark) ---
  "--text-primary": "#FFFFFF",   // Pure White
  "--text-secondary": "#d4d4d4", // Neutral 300
  "--text-tertiary": "#a3a3a3",  // Neutral 400
  "--text-inverted": "#000000",

  // --- Borders (Sharp & Defined) ---
  "--border-subtle": "#333333",
  "--border-default": "#404040",
  "--border-strong": "#737373",
  "--border-focus": "#06b6d4",   // Cyan 500

  // --- Brand Colors (Electric) ---
  "--primary-main": "#06b6d4",   // Cyan 500
  "--primary-hover": "#22d3ee",  // Cyan 400
  "--primary-subtle": "rgba(6, 182, 212, 0.2)", 
  "--primary-text": "#e0f2fe",   // Cyan 50

  // --- Status Indicators (Saturated) ---
  "--status-error-bg": "rgba(185, 28, 28, 0.4)",
  "--status-error-text": "#fca5a5", 
  "--status-success-bg": "rgba(21, 128, 61, 0.4)",
  "--status-success-text": "#86efac", 
  "--status-warning-bg": "rgba(161, 98, 7, 0.4)",
  "--status-warning-text": "#fde047", 

  // --- Component Specifics ---
  "--bg-message-user": "#171717", // Neutral 900
  "--bg-message-ai": "transparent",
  "--bg-input": "#000000",
  "--bg-input-secondary": "#171717",
  "--bg-code": "#050505",
  "--text-code": "#ffffff",
  "--bg-sidebar": "#000000"
};

export default spockeTheme;
