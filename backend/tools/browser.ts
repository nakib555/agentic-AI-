/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { chromium } from 'playwright';
import { ToolError } from '../utils/apiError.js';

export const executeBrowsePage = async (args: { url: string }): Promise<string> => {
    const { url } = args;
    if (!url) {
        throw new ToolError('browsePage', 'MISSING_URL', 'The URL parameter is required.');
    }

    let browser;
    try {
        browser = await chromium.launch();
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            javaScriptEnabled: true,
        });
        const page = await context.newPage();

        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

        // Take a screenshot
        const screenshotBuffer = await page.screenshot();
        const screenshotBase64 = screenshotBuffer.toString('base64');

        // Extract text content
        const textContent = await page.evaluate(() => {
            // A simple text extraction logic, could be improved
            const mainContent = document.querySelector('main') || document.body;
            return mainContent.innerText;
        });

        await browser.close();

        const imageComponent = `[IMAGE_COMPONENT]${JSON.stringify({
            srcUrl: `data:image/png;base64,${screenshotBase64}`,
            alt: `Screenshot of ${url}`,
        })}[/IMAGE_COMPONENT]`;

        const truncatedContent = textContent.substring(0, 4000); // Limit content size

        return `Successfully browsed page. Here is a screenshot and the extracted text content:\n\n${imageComponent}\n\n**Page Content:**\n---\n${truncatedContent}`;

    } catch (error) {
        if (browser) {
            await browser.close();
        }
        const originalError = error instanceof Error ? error : new Error(String(error));
        throw new ToolError('browsePage', 'BROWSER_ERROR', `Failed to browse page: ${originalError.message}`, originalError);
    }
};