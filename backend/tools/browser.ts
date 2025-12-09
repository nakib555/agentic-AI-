
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
        
        // Capture console logs from the page
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'info') {
               // Optional: emit({ log: `[Page] ${msg.text().substring(0, 50)}...` });
            }
        });

        console.log(`[BrowserTool] Visiting: ${url}`);
        emit({ log: `Navigating to ${new URL(url).hostname}...` });

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
        emit({ screenshot: `data:image/jpeg;base64,${base64}`, log: 'View captured.' });
        
        const browserData = {
            url: url,
            title: title,
            screenshot: `data:image/jpeg;base64,${base64}`,
            logs: [`Visited: ${url}`, `Title: ${title}`]
        };

        const uiComponent = `[BROWSER_COMPONENT]${JSON.stringify(browserData)}[/BROWSER_COMPONENT]`;

        if (action === 'screenshot') {
            console.log('[BrowserTool] Action "screenshot" completed successfully.');
            emit({ status: 'completed', log: 'Session finished.' });
            return uiComponent;
        }

        // Default: Read Text (Optimized Markdown Conversion)
        console.log('[BrowserTool] Action "read": Converting content to Markdown...');
        emit({ log: 'Processing content into structured Markdown...' });
        
        const markdown = await page.evaluate(() => {
            // Helper to remove noise
            const removeTags = (selector: string) => document.querySelectorAll(selector).forEach(el => el.remove());
            removeTags('script');
            removeTags('style');
            removeTags('noscript');
            removeTags('iframe');
            removeTags('svg');
            removeTags('nav');
            removeTags('footer');
            removeTags('.ad');
            removeTags('.ads');
            removeTags('[role="alert"]');
            removeTags('[role="banner"]');
            removeTags('[role="dialog"]');

            // Simple TURNDOWN-like logic (HTML -> Markdown)
            function htmlToMarkdown(element: Element): string {
                let text = "";
                
                // Handle specific tags
                const tagName = element.tagName.toLowerCase();
                
                // Process children first
                let childrenText = "";
                element.childNodes.forEach(child => {
                    if (child.nodeType === 3) { // Text node
                        childrenText += child.textContent?.trim() + " ";
                    } else if (child.nodeType === 1) { // Element node
                        childrenText += htmlToMarkdown(child as Element);
                    }
                });
                
                childrenText = childrenText.replace(/\s+/g, " "); // Normalize spaces

                switch (tagName) {
                    case "h1": return `\n# ${childrenText}\n`;
                    case "h2": return `\n## ${childrenText}\n`;
                    case "h3": return `\n### ${childrenText}\n`;
                    case "p": return `\n${childrenText}\n`;
                    case "ul": return `\n${childrenText}\n`;
                    case "ol": return `\n${childrenText}\n`;
                    case "li": return `\n- ${childrenText}`;
                    case "a": 
                        const href = element.getAttribute("href");
                        return href ? `[${childrenText.trim()}](${href}) ` : childrenText;
                    case "b":
                    case "strong": return `**${childrenText.trim()}** `;
                    case "code": return `\`${childrenText.trim()}\` `;
                    case "pre": return `\n\`\`\`\n${element.textContent}\n\`\`\`\n`;
                    case "br": return "\n";
                    case "div": return `\n${childrenText}\n`;
                    default: return childrenText;
                }
            }

            // Target main content if possible, else body
            const main = document.querySelector('main') || document.querySelector('article') || document.body;
            return htmlToMarkdown(main);
        });

        // Further cleanup of the markdown string
        const cleanMarkdown = markdown
            .replace(/\n\s*\n/g, '\n\n') // Remove excessive newlines
            .trim()
            .substring(0, 12000); // Safety cap

        console.log(`[BrowserTool] Content converted. Length: ${cleanMarkdown.length} characters.`);
        emit({ status: 'completed', log: `Extracted ${cleanMarkdown.length} chars of structured content.` });
        
        return `${uiComponent}\n\n### Extracted Content from ${url}\n\n${cleanMarkdown}`;

    } catch (error) {
        const originalError = error instanceof Error ? error : new Error(String(error));
        console.error(`[BrowserTool] FATAL ERROR: ${originalError.message}`);
        emit({ status: 'failed', log: `Error: ${originalError.message}` });
        throw new ToolError('browser', 'NAVIGATION_FAILED', `Failed to visit ${url}. ${originalError.message}`);
    } finally {
        if (page) await page.close();
    }
};
