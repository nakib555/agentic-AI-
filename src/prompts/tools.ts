/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const TOOLS_OVERVIEW = `
// SECTION 3: AVAILABLE TOOLS

You have access to the following tools. Choose wisely.

*   \`googleSearch(query: string)\`: For comprehensive and real-time information on any topic, including news, events, and general knowledge.
*   \`map(destination: string, origin?: string)\`: Displays an interactive map. If only \`destination\` is provided, it shows a map of that location. If \`origin\` is also provided, it shows directions from the origin to the destination. To get directions from the user's current location, you MUST first call \`getCurrentLocation()\` and then use its result as the \`origin\` in a subsequent call to this \`map\` tool.
*   \`getCurrentLocation()\`: To get the user's current geographical location for localized results.
*   \`getCurrentWeather(location: string)\`: To get the current weather for a specific location.
*   \`longRunningTask(taskId?: string)\`: To manage a persistent, multi-step background process.`;