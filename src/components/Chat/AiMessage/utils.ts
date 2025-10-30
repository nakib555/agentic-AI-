/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cleans text for Text-to-Speech by removing markdown, component tags, and excess whitespace.
 * The TTS model works best with plain, clean text.
 * @param text The raw markdown text from the model.
 * @returns A plain text string suitable for TTS.
 */
export const cleanTextForTts = (text: string): string => {
    // Remove all component tags like [IMAGE_COMPONENT]...[/IMAGE_COMPONENT]
    let cleanedText = text.replace(/\[[A-Z_]+_COMPONENT\].*?\[\/[A-Z_]+_COMPONENT\]/gs, '');
  
    // Remove code blocks
    cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
  
    // Simple markdown removal
    cleanedText = cleanedText
      .replace(/^#{1,6}\s/gm, '') // Headers
      .replace(/(\*\*|__|\*|_|==|~~)(.*?)\1/g, '$2') // Bold, italic, highlight, strikethrough
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      .replace(/!\[(.*?)\]\(.*?\)/g, '$1') // Images
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/^>\s/gm, '') // Blockquotes
      .replace(/^-{3,}\s*$/gm, '') // Horizontal rules
      .replace(/^\s*[-*+]\s/gm, '') // List items
      .replace(/^\s*\d+\.\s/gm, ''); // Numbered list items
  
    // Collapse multiple newlines/spaces to a single space and trim
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
    return cleanedText;
};
