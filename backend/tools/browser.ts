
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError.js';
import { chromium, Browser, Page } from 'playwright';

let browserInstance: Browser | null = null;
let activePages = new Map<string, Page>();

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

const getOrCreatePage = async (url: string): Promise<Page> => {
    // Reuse page based on domain to maintain session state roughly
    const domain = new URL(url).hostname;
    
    // Cleanup old pages
    if (activePages.size > 5) {
        const firstKey = activePages.keys().next().value;
        if (firstKey) {
            await activePages.get(firstKey)?.close();
            activePages.delete(firstKey);
        }
    }

    if (activePages.has(domain)) {
        return activePages.get(domain)!;
    }

    const browser = await getBrowser();
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();
    activePages.set(domain, page);
    return page;
};

export const executeBrowser = async (
    args: { 
        url: string, 
        action?: 'read' | 'screenshot' | 'click' | 'type' | 'scroll' | 'wait',
        selector?: string,
        text?: string,
        scrollDirection?: 'up' | 'down' | 'top' | 'bottom'
    }, 
    onUpdate?: BrowserUpdateCallback
): Promise<string> => {
    const { url, action = 'read', selector, text, scrollDirection } = args;
    console.log(`[BrowserTool] Execution started. URL: "${url}", Action: "${action}"`);

    if (!url) {
        throw new ToolError('browser', 'MISSING_URL', 'A URL is required.');
    }

    // Helper to safely emit updates
    const emit = (data: any) => {
        if (onUpdate) onUpdate(data);
    };

    emit({ url, status: 'running', log: `Processing ${action} on ${url}...` });

    try {
        const page = await getOrCreatePage(url);
        
        // Navigate if we aren't already there (fuzzy match)
        if (page.url() !== url) {
            emit({ log: `Navigating to ${url}...` });
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            } catch (e: any) {
                console.warn(`[BrowserTool] Navigation warning: ${e.message}`);
                emit({ log: `Navigation timeout or partial load. Proceeding...` });
            }
        }

        // --- INTERACTION LOGIC ---
        if (action === 'click') {
            if (!selector) throw new ToolError('browser', 'MISSING_SELECTOR', 'Selector required for click action.');
            emit({ log: `Clicking element: ${selector}` });
            await page.click(selector, { timeout: 5000 });
        } 
        else if (action === 'type') {
            if (!selector || !text) throw new ToolError('browser', 'MISSING_ARGS', 'Selector and text required for type action.');
            emit({ log: `Typing into ${selector}...` });
            await page.fill(selector, text, { timeout: 5000 });
        }
        else if (action === 'scroll') {
            emit({ log: `Scrolling ${scrollDirection || 'down'}...` });
            if (scrollDirection === 'top') await page.evaluate(() => window.scrollTo(0, 0));
            else if (scrollDirection === 'bottom') await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            else if (scrollDirection === 'up') await page.evaluate(() => window.scrollBy(0, -500));
            else await page.evaluate(() => window.scrollBy(0, 500));
        }
        else if (action === 'wait') {
            emit({ log: 'Waiting 2 seconds...' });
            await page.waitForTimeout(2000);
        }

        // --- POST-ACTION STATE CAPTURE ---
        
        const title = await page.title();
        const currentUrl = page.url();
        emit({ title, url: currentUrl, log: `Current State: "${title}"` });

        // Always take a fresh screenshot after interaction
        const buffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 60 });
        const base64 = buffer.toString('base64');
        emit({ screenshot: `data:image/jpeg;base64,${base64}`, log: 'View captured.' });
        
        const browserData = {
            url: currentUrl,
            title: title,
            screenshot: `data:image/jpeg;base64,${base64}`,
            logs: [`Action: ${action}`, `Target: ${selector || 'N/A'}`]
        };

        const uiComponent = `[BROWSER_COMPONENT]${JSON.stringify(browserData)}[/BROWSER_COMPONENT]`;

        if (action !== 'read') {
            emit({ status: 'completed', log: 'Interaction complete.' });
            return `${uiComponent}\n\nAction '${action}' completed on ${currentUrl}. Screenshot updated.`;
        }

        // --- READ MODE ---
        console.log('[BrowserTool] Converting content to Markdown...');
        emit({ log: 'Extracting content...' });
        
        const markdown = await page.evaluate(() => {
            // Helper to remove noise
            const removeTags = (selector: string) => document.querySelectorAll(selector).forEach(el => el.remove());
            removeTags('script, style, noscript, iframe, svg, nav, footer, .ad, .ads, [role="alert"], [role="banner"], [role="dialog"]');

            function htmlToMarkdown(element: Element): string {
                let text = "";
                const tagName = element.tagName.toLowerCase();
                
                element.childNodes.forEach(child => {
                    if (child.nodeType === 3) text += child.textContent?.trim() + " ";
                    else if (child.nodeType === 1) text += htmlToMarkdown(child as Element);
                });
                
                text = text.replace(/\s+/g, " ");

                switch (tagName) {
                    case "h1": return `\n# ${text}\n`;
                    case "h2": return `\n## ${text}\n`;
                    case "h3": return `\n### ${text}\n`;
                    case "p": return `\n${text}\n`;
                    case "li": return `\n- ${text}`;
                    case "a": return element.getAttribute("href") ? `[${text.trim()}](${element.getAttribute("href")}) ` : text;
                    case "code": return `\`${text.trim()}\` `;
                    case "pre": return `\n\`\`\`\n${element.textContent}\n\`\`\`\n`;
                    case "br": return "\n";
                    case "div": return `\n${text}\n`;
                    default: return text;
                }
            }
            const main = document.querySelector('main') || document.querySelector('article') || document.body;
            return htmlToMarkdown(main);
        });

        const cleanMarkdown = markdown.replace(/\n\s*\n/g, '\n\n').trim().substring(0, 15000);
        emit({ status: 'completed', log: `Extracted ${cleanMarkdown.length} chars.` });
        
        return `${uiComponent}\n\n### Extracted Content from ${currentUrl}\n\n${cleanMarkdown}`;

    } catch (error) {
        const originalError = error instanceof Error ? error : new Error(String(error));
        console.error(`[BrowserTool] FATAL ERROR: ${originalError.message}`);
        emit({ status: 'failed', log: `Error: ${originalError.message}` });
        throw new ToolError('browser', 'INTERACTION_FAILED', `Failed on ${url}: ${originalError.message}`);
    }
};
