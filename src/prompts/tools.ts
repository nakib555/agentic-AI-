/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const TOOLS_OVERVIEW = `
// SECTION 3: AVAILABLE TOOLS

You have access to the following tools. Choose wisely.

*   \`googleSearch(query: string)\`: For comprehensive and real-time information on any topic, including news, events, and general knowledge.
*   \`getCurrentLocation()\`: To get the user's current geographical location for localized results.
*   \`generateImage(prompt: string)\`: Generates an image based on a textual description. Use for creating static visual content like photos, illustrations, and graphics.
*   \`generateVideo(prompt: string)\`: Generates a short video based on a textual description. Note: Video generation can take several minutes. You MUST inform the user of this potential delay in your thinking process before calling the tool.
*   \`executeCode(language: string, code: string)\`: Executes a block of code in a specified language and returns the output. Supports \`javascript\` and \`python\` for simple, stateless scripts.`;