
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
            console.log('[BrowserTool] Launching Chromium instance...');
            browserInstance = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some container envs
            });
            console.log('[BrowserTool] Chromium launched successfully.');
        } catch (e) {
            console.error("[BrowserTool] Failed to launch browser. Ensure playwright is installed.", e);
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
    console.log(`[BrowserTool] Execution started. URL: "${url}", Action: "${action}"`);

    if (!url) {
        console.error('[BrowserTool] Error: Missing "url" argument.');
        throw new ToolError('browser', 'MISSING_URL', 'A URL is required.');
    }

    // Helper to safely emit updates
    const emit = (data: any) => {
        if (onUpdate) onUpdate(data);
    };

    emit({ url, status: 'running', log: `Initializing browser session for ${url}...` });

    let page = null;
    try {
        console.log('[BrowserTool] Acquiring browser context...');
        const browser = await getBrowser();
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport: { width: 1280, height: 800 }
        });
        page = await context.newPage();
        console.log('[BrowserTool] Page created. Initiating navigation...');

        console.log(`[BrowserTool] Visiting: ${url}`);
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
            console.log('[BrowserTool] Navigation event "domcontentloaded" fired.');
        } catch (e: any) {
            console.warn(`[BrowserTool] Navigation warning (timeout or partial load): ${e.message}`);
            emit({ log: `Navigation timeout or partial load. Proceeding...` });
        }

        const title = await page.title();
        console.log(`[BrowserTool] Page title retrieved: "${title}"`);
        emit({ title, log: `Page loaded: "${title}"` });

        // Take an initial screenshot to show the user what we found
        console.log('[BrowserTool] Taking initial screenshot...');
        emit({ log: 'Capturing page view...' });
        const buffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 60 });
        const base64 = buffer.toString('base64');
        console.log(`[BrowserTool] Screenshot captured (${base64.length} bytes).`);
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
            console.log('[BrowserTool] Action "screenshot" completed successfully.');
            emit({ status: 'completed', log: 'Session finished.' });
            return uiComponent;
        }

        // Default: Read Text
        console.log('[BrowserTool] Action "read": Extracting text content...');
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

        console.log(`[BrowserTool] Content extracted. Length: ${cleanContent.length} characters.`);
        emit({ status: 'completed', log: `Extracted ${cleanContent.length} characters.` });
        return `${uiComponent}\n\nExtracted Content from ${url}:\n\n${cleanContent}`;

    } catch (error) {
        const originalError = error instanceof Error ? error : new Error(String(error));
        
        // DETAILED ERROR LOGGING
        console.error(`[BrowserTool] FATAL ERROR during execution.`);
        console.error(`[BrowserTool] Target URL: ${url}`);
        console.error(`[BrowserTool] Error Message: ${originalError.message}`);
        console.error(`[BrowserTool] Stack Trace:`, originalError.stack);
        if (page) {
             try {
                console.error(`[BrowserTool] Page Context - Is Closed: ${page.isClosed()}, Current URL: ${page.url()}`);
             } catch (e) {
                console.error(`[BrowserTool] Could not retrieve page context.`);
             }
        }

        emit({ status: 'failed', log: `Error: ${originalError.message}` });
        throw new ToolError('browser', 'NAVIGATION_FAILED', `Failed to visit ${url}. ${originalError.message}`);
    } finally {
        if (page) {
            console.log('[BrowserTool] Cleaning up: Closing page.');
            await page.close();
        }
    }
};
