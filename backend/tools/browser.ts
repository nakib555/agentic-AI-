/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError.js';
import { chromium, Browser } from 'playwright';

let browserInstance: Browser | null = null;

const getBrowser = async () => {
    if (!browserInstance) {
        try {
            browserInstance = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some container envs
            });
        } catch (e) {
            console.error("Failed to launch browser. Ensure playwright is installed.", e);
            throw new Error("Browser initialization failed. Server checks required.");
        }
    }
    return browserInstance;
};

export const executeBrowser = async (args: { url: string, action?: 'read' | 'screenshot' }): Promise<string> => {
    const { url, action = 'read' } = args;

    if (!url) {
        throw new ToolError('browser', 'MISSING_URL', 'A URL is required.');
    }

    let page = null;
    try {
        const browser = await getBrowser();
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport: { width: 1280, height: 800 }
        });
        page = await context.newPage();

        console.log(`[Browser] Visiting: ${url}`);
        
        // 15s timeout to prevent hanging
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        if (action === 'screenshot') {
            const buffer = await page.screenshot({ fullPage: false });
            const base64 = buffer.toString('base64');
            const data = JSON.stringify({
                srcUrl: `data:image/png;base64,${base64}`,
                caption: `Screenshot of ${url}`,
                alt: `Website screenshot of ${url}`
            });
            return `[IMAGE_COMPONENT]${data}[/IMAGE_COMPONENT]`;
        }

        // Default: Read Text
        // Evaluate script to get readable text, stripping hidden elements/scripts/styles
        const content = await page.evaluate(() => {
            // Helper to remove elements
            const removeTags = (selector: string) => {
                document.querySelectorAll(selector).forEach(el => el.remove());
            };
            
            // Clean up noise
            removeTags('script');
            removeTags('style');
            removeTags('noscript');
            removeTags('iframe');
            removeTags('svg');
            removeTags('nav');
            removeTags('footer');
            removeTags('.ad');
            removeTags('.ads');
            removeTags('.popup');
            
            // Basic extraction of main text content
            return document.body.innerText;
        });

        // Compress whitespace
        const cleanContent = content.replace(/\s+/g, ' ').trim().substring(0, 8000); // Limit tokens

        return `Content from ${url}:\n\n${cleanContent}`;

    } catch (error) {
        const originalError = error instanceof Error ? error : new Error(String(error));
        console.error(`Browser tool error for ${url}:`, originalError);
        throw new ToolError('browser', 'NAVIGATION_FAILED', `Failed to visit ${url}. ${originalError.message}`);
    } finally {
        if (page) await page.close();
    }
};