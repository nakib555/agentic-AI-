/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const COLORS = [
  // A palette of Tailwind CSS classes for agent identification
  { bg: 'bg-agent-bg', text: 'text-agent-text', border: 'border-agent-border' },
  { bg: 'bg-agent-bg', text: 'text-agent-text', border: 'border-agent-border' }, // Can add more variants if themes define more agent colors
];

/**
 * Generates a consistent color pairing for an agent name.
 * @param agentName The name of the agent.
 * @returns An object with Tailwind CSS classes for background, text, and border.
 */
export const getAgentColor = (agentName: string) => {
  // Simple hash function to get a number from the string
  let hash = 0;
  for (let i = 0; i < agentName.length; i++) {
    hash = agentName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % COLORS.length);
  return COLORS[index];
};