
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const spockeTheme = {
  // --- Base Layers (True Void / High Contrast) ---
  "--bg-page": "#000000",        // True Black
  "--bg-layer-1": "#000000",     // True Black
  "--bg-layer-2": "#111111",     // Almost Black
  "--bg-layer-3": "#222222",     // Deep Gray
  "--bg-glass": "#000000",       // Opaque black for max readability

  // --- Text Colors (Stark & Crisp) ---
  "--text-primary": "#FFFFFF",   // Pure White
  "--text-secondary": "#e0e0e0", // Very Light Gray
  "--text-tertiary": "#a0a0a0",  // Light Gray
  "--text-inverted": "#000000",

  // --- Borders (Sharp & Defined for Desktop Precision) ---
  "--border-subtle": "#333333",
  "--border-default": "#444444",
  "--border-strong": "#888888",
  "--border-focus": "#00f0ff",   // Neon Cyan

  // --- Brand Colors (Electric / Cyberpunk) ---
  "--primary-main": "#00d9f9",   // Electric Cyan
  "--primary-hover": "#60efff",  // Bright Cyan
  "--primary-subtle": "rgba(0, 217, 249, 0.15)", 
  "--primary-text": "#e0faff",

  // --- Status Indicators (Saturated Neon) ---
  "--status-error-bg": "rgba(255, 0, 0, 0.15)",
  "--status-error-text": "#ff4d4d", // Bright Red
  "--status-success-bg": "rgba(0, 255, 0, 0.15)",
  "--status-success-text": "#4ade80", // Bright Green
  "--status-warning-bg": "rgba(255, 255, 0, 0.1)",
  "--status-warning-text": "#facc15", // Bright Yellow

  // --- Component Specifics ---
  "--bg-message-user": "#111111", 
  "--bg-message-ai": "transparent",
  "--bg-input": "#050505",
  "--bg-input-secondary": "#111111",
  "--bg-code": "#080808",
  "--text-code": "#00ff9d",       // Matrix Green for code
  "--bg-sidebar": "#000000"
};

export default spockeTheme;
