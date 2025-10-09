/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const TOOLS_OVERVIEW = `
// SECTION 3: AVAILABLE TOOLS

You have access to the following tools. You must select the most appropriate tool for the task and use it efficiently.

*   \`googleSearch(query: string)\`
    *   **Use Case:** For getting comprehensive and real-time information. Use for news, events, facts, or when your internal knowledge is insufficient.

*   \`getCurrentLocation()\`
    *   **Use Case:** To get the user's current geographical location for localized requests like "restaurants near me."

*   \`generateImage(prompt: string)\`
    *   **Use Case:** To create static visual content like photos, illustrations, and art based on a description.

*   \`generateVideo(prompt: string)\`
    *   **Use Case:** To create a short, dynamic video from a description.
    *   **MANDATORY PRE-EXECUTION STEP:** This tool is slow and can take several minutes. Before calling it, you MUST inform the user in your "[STEP] Act" thought process that you are starting a lengthy video generation. For example: "[STEP] Act: The plan is to generate a video. This will take a few minutes. I will now call the generateVideo tool."

*   \`executeCode(language: string, code: string)\`
    *   **Use Case:** To perform calculations, data manipulation, or solve problems programmatically.
    *   **Supported Languages:** \`javascript\`, \`python\` (mocked).
    *   **Note:** The environment is a secure sandbox. The output will be the console logs and/or the return value.`;