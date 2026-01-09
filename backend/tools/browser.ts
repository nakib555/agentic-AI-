
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolError } from '../utils/apiError';
import { chromium, Browser, Page } from 'playwright';

let browserInstance: Browser | null = null;
let activePages = new Map<string, Page>();

// Helper to launch browser
const getBrowser = async () => {
    if (!browserInstance) {
        try {
            console.log('[BrowserTool] Launching Chromium instance...');
            browserInstance = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
            });
            console.log('[BrowserTool] Chromium launched successfully.');
        } catch (e) {
            console.error("[BrowserTool] Failed to launch browser.", e);
            throw new Error("Browser initialization failed.");
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
    const domain = new URL(url).hostname;
    
    // Manage memory: close old pages if limit reached
    if (activePages.size >= 4) {
        // Simple FIFO: Remove the first key found in the iterator
        const firstKey = activePages.keys().next().value;
        if (firstKey) {
            try {
                await activePages.get(firstKey)?.close();
            } catch(e) {}
            activePages.delete(firstKey);
        }
    }

    if (activePages.has(domain)) {
        const page = activePages.get(domain)!;
        // Check if page is actually open/usable
        try {
            if (page.isClosed()) throw new Error("Page closed");
            return page;
        } catch {
            activePages.delete(domain);
        }
    }

    const browser = await getBrowser();
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    activePages.set(domain, page);
    return page;
};

export const executeBrowser = async (
    args: { 
        url: string, 
        action?: 'read' | 'screenshot' | 'click' | 'type' | 'scroll' | 'wait',
        waitUntil?: 'domcontentloaded' | 'networkidle' | 'load',
        selector?: string,
        text?: string,
        scrollDirection?: 'up' | 'down' | 'top' | 'bottom'
    }, 
    onUpdate?: BrowserUpdateCallback
): Promise<string> => {
    const { url, action = 'read', waitUntil = 'domcontentloaded', selector, text, scrollDirection } = args;
    console.log(`[BrowserTool] Execution started. URL: "${url}", Action: "${action}", Wait: "${waitUntil}"`);

    if (!url) {
        throw new ToolError('browser', 'MISSING_URL', 'A URL is required.');
    }

    const emit = (data: any) => { if (onUpdate) onUpdate(data); };

    emit({ url, status: 'running', log: `Processing ${action} on ${url}...` });

    try {
        const page = await getOrCreatePage(url);
        
        // Navigation Logic
        if (page.url() !== url) {
            emit({ log: `Navigating to ${url} (Wait: ${waitUntil})...` });
            try {
                await page.goto(url, { waitUntil, timeout: 30000 });
            } catch (e: any) {
                console.warn(`[BrowserTool] Navigation warning: ${e.message}`);
                // Proceed if we loaded *something*, otherwise throw
                if (!page.url()) throw e;
            }
        }

        // --- INTERACTION LOGIC ---
        if (action === 'click') {
            if (!selector) throw new ToolError('browser', 'MISSING_SELECTOR', 'Selector required for click.');
            emit({ log: `Clicking element: ${selector}` });
            
            try {
                await page.click(selector, { timeout: 5000 });
            } catch (e) {
                console.log(`[BrowserTool] Selector click failed, trying text match: ${selector}`);
                await page.getByText(selector).first().click({ timeout: 5000 });
            }
            // After click, we often want to wait for network settling
            if (waitUntil === 'networkidle') {
                await page.waitForLoadState('networkidle').catch(() => {});
            }
        } 
        else if (action === 'type') {
            if (!selector || !text) throw new ToolError('browser', 'MISSING_ARGS', 'Selector and text required.');
            emit({ log: `Typing into ${selector}...` });
            await page.fill(selector, text);
        }
        else if (action === 'scroll') {
            emit({ log: `Scrolling ${scrollDirection || 'down'}...` });
            if (scrollDirection === 'top') await page.evaluate(() => window.scrollTo(0, 0));
            else if (scrollDirection === 'bottom') await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            else await page.evaluate(() => window.scrollBy(0, 600));
        }
        else if (action === 'wait') {
            emit({ log: 'Waiting 3s for animations...' });
            await page.waitForTimeout(3000);
        }

        const title = await page.title();
        const currentUrl = page.url();
        
        // Take Screenshot
        const buffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 60 });
        const base64 = buffer.toString('base64');
        emit({ screenshot: `data:image/jpeg;base64,${base64}`, log: 'View captured.', title, url: currentUrl });
        
        const browserData = {
            url: currentUrl,
            title: title,
            screenshot: `data:image/jpeg;base64,${base64}`,
            logs: [`Action: ${action}`, `Target: ${selector || 'N/A'}`]
        };

        const uiComponent = `[BROWSER_COMPONENT]${JSON.stringify(browserData)}[/BROWSER_COMPONENT]`;

        if (action !== 'read') {
            emit({ status: 'completed', log: 'Interaction complete.' });
            return `${uiComponent}\n\nAction '${action}' completed on ${title}.`;
        }

        // --- READ MODE ---
        emit({ log: 'Extracting clean content...' });
        const markdown = await page.evaluate(() => {
            // Aggressive cleaning to remove noise
            const removeTags = (sel: string) => document.querySelectorAll(sel).forEach(el => el.remove());
            removeTags('script, style, noscript, iframe, svg, nav, footer, header, .ad, .ads, .cookie-banner, .popup, [role="alert"], [role="banner"], [role="dialog"]');

            function htmlToMarkdown(element: Element): string {
                let text = "";
                const tagName = element.tagName.toLowerCase();
                
                element.childNodes.forEach(child => {
                    if (child.nodeType === 3) {
                        // Text node
                        text += child.textContent?.trim() + " ";
                    } else if (child.nodeType === 1) {
                        // Element node
                        text += htmlToMarkdown(child as Element);
                    }
                });
                
                text = text.replace(/\s+/g, " "); // collapse whitespace
                
                if (tagName === "h1") return `\n# ${text}\n`;
                if (tagName === "h2") return `\n## ${text}\n`;
                if (tagName === "h3") return `\n### ${text}\n`;
                if (tagName === "p") return `\n${text}\n`;
                if (tagName === "li") return `\n- ${text}`;
                if (tagName === "br") return `\n`;
                if (tagName === "a") {
                    const href = element.getAttribute("href");
                    return href ? `[${text.trim()}](${href}) ` : text;
                }
                if (tagName === "table") return `\n[Table Omitted]\n`; // Tables are hard to parse simply, usually simpler to omit in read mode
                
                return text;
            }
            return htmlToMarkdown(document.body);
        });

        // Post-processing cleanup
        const cleanMarkdown = markdown
            .replace(/\n\s*\n/g, '\n\n') // Reduce multiple newlines
            .trim()
            .substring(0, 20000); // Higher limit

        emit({ status: 'completed', log: `Extracted ${cleanMarkdown.length} chars.` });
        
        return `${uiComponent}\n\n### Extracted Content from ${title} (${currentUrl})\n\n${cleanMarkdown}`;

    } catch (error) {
        const err = error as Error;
        console.error(`[BrowserTool] Error: ${err.message}`);
        emit({ status: 'failed', log: `Error: ${err.message}` });
        throw new ToolError('browser', 'INTERACTION_FAILED', err.message);
    }
};
