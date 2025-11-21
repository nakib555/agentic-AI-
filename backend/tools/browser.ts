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

type BrowserUpdateCallback = (data: { 
    log?: string; 
    screenshot?: string; 
    url?: string; 
    title?: string;
    status?: 'running' | 'completed' | 'failed';
}) => void;

export const executeBrowser = async (
    args: { url: string, action?: 'read' | 'screenshot' }, 
    onUpdate?: BrowserUpdateCallback
): Promise<string> => {
    const { url, action = 'read' } = args;

    if (!url) {
        throw new ToolError('browser', 'MISSING_URL', 'A URL is required.');
    }

    // Helper to safely emit updates
    const emit = (data: any) => {
        if (onUpdate) onUpdate(data);
    };

    emit({ url, status: 'running', log: `Initializing browser session for ${url}...` });

    let page = null;
    try {
        const browser = await getBrowser();
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport: { width: 1280, height: 800 }
        });
        page = await context.newPage();

        console.log(`[Browser] Visiting: ${url}`);
        emit({ log: `Navigating to ${new URL(url).hostname}...` });
        
        // Capture console logs from the page to show "activity"
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'info') {
               // Optional: emit({ log: `[Page] ${msg.text().substring(0, 50)}...` });
            }
        });

        // 15s timeout to prevent hanging
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (e) {
            emit({ log: `Navigation timeout or partial load. Proceeding...` });
        }

        const title = await page.title();
        emit({ title, log: `Page loaded: "${title}"` });

        // Take an initial screenshot to show the user what we found
        emit({ log: 'Capturing page view...' });
        const buffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 60 });
        const base64 = buffer.toString('base64');
        emit({ screenshot: `data:image/jpeg;base64,${base64}`, log: 'View captured.' });
        
        // Generate logs based on action
        const logs = [
            `Initializing headless browser...`,
            `Navigating to ${new URL(url).hostname}...`,
            `Waiting for DOM content to load...`,
            `Page loaded: "${title}"`,
            `Action: ${action === 'screenshot' ? 'Capturing full-page view' : 'Extracting main content'}`
        ];
        
        const browserData = {
            url: url,
            title: title,
            screenshot: `data:image/jpeg;base64,${base64}`,
            logs: logs
        };

        const uiComponent = `[BROWSER_COMPONENT]${JSON.stringify(browserData)}[/BROWSER_COMPONENT]`;

        if (action === 'screenshot') {
            emit({ status: 'completed', log: 'Session finished.' });
            return uiComponent;
        }

        // Default: Read Text
        emit({ log: 'Extracting text content...' });
        
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

        emit({ status: 'completed', log: `Extracted ${cleanContent.length} characters.` });
        return `${uiComponent}\n\nExtracted Content from ${url}:\n\n${cleanContent}`;

    } catch (error) {
        const originalError = error instanceof Error ? error : new Error(String(error));
        console.error(`Browser tool error for ${url}:`, originalError);
        emit({ status: 'failed', log: `Error: ${originalError.message}` });
        throw new ToolError('browser', 'NAVIGATION_FAILED', `Failed to visit ${url}. ${originalError.message}`);
    } finally {
        if (page) await page.close();
    }
};