
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const spockeTheme = {
  // --- Base Layers (True Void & OLED Black) ---
  "--bg-page": "#000000",        // True Black
  "--bg-layer-1": "#0A0A0A",     // Almost Black (Cards)
  "--bg-layer-2": "#111111",     // Dark Gray (Inputs/Hover)
  "--bg-layer-3": "#1A1A1A",     // Lighter Gray (Active)
  "--bg-glass": "rgba(0, 0, 0, 0.85)", // High density tint

  // --- Text Colors (High Contrast) ---
  "--text-primary": "#FFFFFF",   // Pure White
  "--text-secondary": "#A3A3A3", // Neutral 400
  "--text-tertiary": "#525252",  // Neutral 600
  "--text-inverted": "#000000",

  // --- Borders (Electric & Sharp) ---
  "--border-subtle": "#1F1F1F",
  "--border-default": "#262626",
  "--border-strong": "#404040",
  "--border-focus": "#06b6d4",   // Cyan 500

  // --- Brand Colors (Electric Cyan/Teal Glow) ---
  "--primary-main": "#06b6d4",   // Cyan 500
  "--primary-hover": "#22d3ee",  // Cyan 400
  "--primary-subtle": "rgba(6, 182, 212, 0.1)", // Very subtle cyan tint
  "--primary-text": "#cffafe",   // Cyan 100

  // --- Status Indicators (Vibrant & Saturated) ---
  "--status-error-bg": "rgba(220, 38, 38, 0.15)",
  "--status-error-text": "#f87171", // Red 400
  "--status-success-bg": "rgba(22, 163, 74, 0.15)",
  "--status-success-text": "#4ade80", // Green 400
  "--status-warning-bg": "rgba(234, 179, 8, 0.15)",
  "--status-warning-text": "#facc15", // Yellow 400

  // --- Component Specifics ---
  "--bg-message-user": "#111111", 
  "--bg-message-ai": "transparent",
  "--bg-input": "#050505",
  "--bg-input-secondary": "#0A0A0A",
  "--bg-code": "#000000",
  "--text-code": "#e4e4e7",      // Neutral Zinc 200 (Matches Dark Theme)
  "--bg-sidebar": "#000000"
};

export default spockeTheme;
