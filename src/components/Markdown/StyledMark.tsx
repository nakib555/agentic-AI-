
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Enhanced color palette for custom markdown highlighting
const colorMap: Record<string, string> = {
    // Standard Colors
    red:    "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30",
    blue:   "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30",
    green:  "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30",
    yellow: "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30",
    orange: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30",
    purple: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30",
    pink:   "text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/30",
    teal:   "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30",
    gray:   "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800",
    
    // Semantic Aliases
    error:  "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30",
    warn:   "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30",
    info:   "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30",
    success:"text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30",
};

export const StyledMark: React.FC = (props: any) => {
    const children = React.Children.toArray(props.children);
    
    // Check if the first child is a string and contains a color tag like [red]
    if (children.length > 0 && typeof children[0] === 'string') {
        const firstChild = children[0] as string;
        const colorMatch = firstChild.match(/^\[([a-zA-Z]+)\]/);
        
        if (colorMatch && colorMatch[1]) {
            const colorName = colorMatch[1].toLowerCase();
            const classes = colorMap[colorName];
            
            // Remove the [color] tag from the text
            const text = firstChild.substring(colorMatch[0].length);
            
            // Update children array: replace the first tag-bearing string with the clean text
            if (text) {
                children[0] = text;
            } else {
                children.shift();
            }

            if (classes) {
                return (
                    <span className={`px-1 rounded-md font-medium mx-0.5 ${classes}`}>
                        {children}
                    </span>
                );
            }
        }
    }

    // Default "Yellow Highlighter" behavior for standard `==text==` without color tag
    return (
        <mark className="bg-yellow-200 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-100 rounded px-1 py-0.5 mx-0.5 font-medium">
            {props.children}
        </mark>
    );
};
