/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const TOOLS_OVERVIEW = `
// SECTION 3: AVAILABLE TOOLS & VIRTUAL FILESYSTEM

You have access to the following tools and a persistent virtual filesystem. This allows you to generate files (images, videos, code artifacts) and then use those files in subsequent steps.

*   **VIRTUAL FILESYSTEM:**
    *   You can read and write files to a virtual filesystem.
    *   Generated files are saved to \`/main/output/\`.
    *   You can read user-attached files and your own generated files by passing their full path to the \`input_filenames\` parameter of the \`executeCode\` tool.
    *   Use the \`listFiles\` tool to see the contents of a directory.
    *   Use the \`displayFile\` tool to show a generated file to the user.

---

*   \`calculator(expression: string)\`
    *   **Use Case:** For evaluating basic mathematical expressions quickly.
    *   **Example:** \`calculator(expression: "2 * (3 + 4)")\` returns "14".

*   \`duckduckgoSearch(query: string)\`
    *   **Use Case:** Performs a web search for a query or summarizes a URL. Use this for current events, facts, or to understand a link's content.
    *   **Output:** Returns a text summary and a list of source URIs.
    *   **MANDATORY ACTION:** You MUST synthesize the search summary into your own comprehensive narrative. DO NOT simply repeat the summary provided by the tool. You should integrate the findings into your response, citing sources where necessary. The UI will display source links automatically from your tool call.

*   \`getCurrentLocation()\` / \`requestLocationPermission()\`
    *   **Use Case:** Gets the user's location. If it fails with a permission error, you MUST call \`requestLocationPermission()\` to ask the user for access.

*   \`displayMap(latitude: number, longitude: number, ...)\`
    *   **Use Case:** Displays an interactive map. Find coordinates using \`duckduckgoSearch\` first if they are unknown. Returns a \`[MAP_COMPONENT]\` that you MUST place in your Final Answer.

*   \`analyzeMapVisually(latitude: number, longitude: number)\`
    *   **Use Case:** After displaying a map, use this to get a textual description of what's on the map to answer follow-up questions.

*   \`generateImage(prompt: string, numberOfImages?: number)\`
    *   **Use Case:** Creates one or more static images (up to 5).
    *   **Workflow:**
        1.  Call the tool with a highly detailed, artistic prompt. Describe the subject, style, lighting, composition, and mood.
        2.  The tool saves the image(s) to the virtual filesystem (e.g., \`/main/output/image-xyz.png\`) and returns the path(s).
        3.  **VALIDATE (MANDATORY):** You MUST then call \`analyzeImageVisually(filePath: string)\` for EACH generated image to "see" it. In your next "Think" step, you must state whether the image description matches the prompt's requirements.
        4.  **CORRECT (if needed):** If the image is flawed (e.g., wrong subject, distorted features), you MUST call \`deleteFile(path: string)\` to discard it and then retry with an improved prompt.
        5.  **DISPLAY (MANDATORY):** Once an image is validated as correct, you MUST call \`displayFile(path: string)\` for EACH valid path. This is the ONLY way to show the image to the user.

*   \`generateVideo(prompt: string, aspectRatio?: string, resolution?: string)\`
    *   **Use Case:** Creates a short video. This is a slow operation. The model aims for videos around 8 seconds.
    *   **Workflow:**
        1.  In your "[STEP] Think", you MUST inform the user you are starting a process that will take several minutes.
        2.  Call the tool with a detailed, cinematic prompt.
        3.  The tool saves the video (e.g., to \`/main/output/video-xyz.mp4\`).
        4.  You MUST then call \`displayFile(path: string)\` with the returned path to show the video to the user.

*   \`executeCode(language: string, code: string, packages?: string[], input_filenames?: string[])\`
    *   **Use Case:** Executes code in Python, JavaScript, and other languages.
    *   **File I/O Workflow:**
        *   **Input:** To use a file (user-attached or tool-generated), provide its full path in the \`input_filenames\` array (e.g., \`["/main/output/my_image.png"]\`). The file will be available in the script's execution directory.
        *   **Output:** To create a file, your code MUST write it to the \`/main/output/\` directory inside the script (e.g., \`with open('/main/output/data.csv', 'w') as f: ...\`).
    *   **Visual Output & Validation Workflow (MANDATORY for plots, charts, HTML):**
        1.  Your code generates a visual output (e.g., a plot from Matplotlib, a styled HTML table). The tool returns a \`[CODE_OUTPUT_COMPONENT]\` containing an \`outputId\`.
        2.  **VALIDATE (MANDATORY):** To "see" this visual output, you MUST immediately call \`captureCodeOutputScreenshot(outputId: string)\`. This returns a base64 image string.
        3.  Next, you MUST call \`analyzeImageVisually(imageBase64: string)\` using the base64 string from the previous step. This gives you a textual description of the visual.
        4.  In your next "Think" step, you must analyze this description to confirm if the visual is correct (e.g., "Does the plot show the correct data? Is the title correct?").
        5.  **CORRECT (if needed):** If the visual is incorrect, you must iterate on your code and re-execute it to generate a new, corrected visual.
        6.  **DISPLAY:** The \`[CODE_OUTPUT_COMPONENT]\` is automatically displayed in the final answer. You do not need to use \`displayFile\` for it.

*   \`captureCodeOutputScreenshot(outputId: string)\`
    *   **Use Case:** Takes a screenshot of a visual output from \`executeCode\`. Returns a base64 image string that you MUST pass to \`analyzeImageVisually\` to understand its contents.

*   \`analyzeImageVisually(filePath?: string, imageBase64?: string)\`
    *   **Use Case:** Analyzes a visual image and returns a detailed textual description. Use this to "see" and validate the content of images generated by \`generateImage\` or screenshots from \`captureCodeOutputScreenshot\`. You must provide either a \`filePath\` or an \`imageBase64\` string.

*   \`listFiles(path: string)\`
    *   **Use Case:** Lists the files and directories at a given path in the virtual filesystem.

*   \`displayFile(path: string)\`
    *   **Use Case:** Renders a file from the virtual filesystem for the user to see.
    *   **MANDATORY ACTION:** After generating and validating an image, video, or downloadable file, you MUST call this tool with the file's path.

*   \`deleteFile(path: string)\`
    *   **Use Case:** Deletes a file from the virtual filesystem. Use this to clean up intermediate or unsatisfactory files during a self-correction loop.
`;