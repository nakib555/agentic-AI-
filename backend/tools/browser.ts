
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError.js';

// Define the type for the browser instance implicitly
let browserInstance: any | null = null;

// Dynamic import helper
const getPlaywright = async () => {
    try {
        // @ts-ignore
        const { chromium } = await import('playwright');
        return chromium;
    } catch (e) {
        console.error("Playwright import failed. It might not be available in this environment.");
        return null;
    }
};

const getBrowser = async () => {
    if (!browserInstance) {
        try {
            console.log('[BrowserTool] Launching Chromium instance...');
            const chromium = await getPlaywright();
            if (!chromium) throw new Error("Playwright not found");
            
            browserInstance = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'] 
            });
            console.log('[BrowserTool] Chromium launched successfully.');
        } catch (e) {
            console.error("[BrowserTool] Failed to launch browser.", e);
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
    // Platform check
    if (typeof process === 'undefined' || !(process as any).versions || !(process as any).versions.node) {
        throw new ToolError('browser', 'ENV_NOT_SUPPORTED', 'Browser tool requires a Node.js environment (Render). It does not work on Cloudflare Workers.');
    }

    const { url, action = 'read' } = args;
    console.log(`[BrowserTool] Execution started. URL: "${url}", Action: "${action}"`);

    if (!url) {
        throw new ToolError('browser', 'MISSING_URL', 'A URL is required.');
    }

    const emit = (data: any) => { if (onUpdate) onUpdate(data); };
    emit({ url, status: 'running', log: `Initializing browser session for ${url}...` });

    let page = null;
    try {
        const browser = await getBrowser();
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            viewport: { width: 1280, height: 800 }
        });
        page = await context.newPage();
        
        // Capture console logs (optional)
        page.on('console', (msg: any) => {
            if (msg.type() === 'log' || msg.type() === 'info') {
               // emit({ log: `[Page] ${msg.text().substring(0, 50)}...` });
            }
        });

        console.log(`[BrowserTool] Visiting: ${url}`);
        emit({ log: `Navigating to ${new URL(url).hostname}...` });

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (e: any) {
            console.warn(`[BrowserTool] Navigation warning: ${e.message}`);
            emit({ log: `Navigation timeout or partial load. Proceeding...` });
        }

        const title = await page.title();
        emit({ title, log: `Page loaded: "${title}"` });

        console.log('[BrowserTool] Taking screenshot...');
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
            emit({ status: 'completed', log: 'Session finished.' });
            return uiComponent;
        }

        console.log('[BrowserTool] Converting content to Markdown...');
        emit({ log: 'Processing content...' });
        
        const markdown = await page.evaluate(() => {
            const removeTags = (selector: string) => document.querySelectorAll(selector).forEach(el => el.remove());
            removeTags('script'); removeTags('style'); removeTags('noscript'); removeTags('iframe');
            removeTags('nav'); removeTags('footer');

            function htmlToMarkdown(element: Element): string {
                let text = "";
                let childrenText = "";
                element.childNodes.forEach(child => {
                    if (child.nodeType === 3) childrenText += child.textContent?.trim() + " ";
                    else if (child.nodeType === 1) childrenText += htmlToMarkdown(child as Element);
                });
                childrenText = childrenText.replace(/\s+/g, " ");

                switch (element.tagName.toLowerCase()) {
                    case "h1": return `\n# ${childrenText}\n`;
                    case "h2": return `\n## ${childrenText}\n`;
                    case "h3": return `\n### ${childrenText}\n`;
                    case "p": return `\n${childrenText}\n`;
                    case "li": return `\n- ${childrenText}`;
                    case "a": return element.getAttribute("href") ? `[${childrenText.trim()}](${element.getAttribute("href")}) ` : childrenText;
                    case "b": case "strong": return `**${childrenText.trim()}** `;
                    case "code": return `\`${childrenText.trim()}\` `;
                    default: return childrenText;
                }
            }
            const main = document.querySelector('main') || document.querySelector('article') || document.body;
            return htmlToMarkdown(main);
        });

        const cleanMarkdown = markdown.replace(/\n\s*\n/g, '\n\n').trim().substring(0, 12000);
        emit({ status: 'completed', log: `Extracted ${cleanMarkdown.length} chars.` });
        
        return `${uiComponent}\n\n### Extracted Content from ${url}\n\n${cleanMarkdown}`;

    } catch (error: any) {
        console.error(`[BrowserTool] ERROR: ${error.message}`);
        emit({ status: 'failed', log: `Error: ${error.message}` });
        throw new ToolError('browser', 'NAVIGATION_FAILED', `Failed to visit ${url}. ${error.message}`);
    } finally {
        if (page) await page.close();
    }
};
