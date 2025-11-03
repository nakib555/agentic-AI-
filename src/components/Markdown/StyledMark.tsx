/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const StyledMark: React.FC = (props: any) => {
    const children = React.Children.toArray(props.children);
    
    // Check if the first child is a string and contains a color tag like [red]
    if (children.length > 0 && typeof children[0] === 'string') {
        const firstChild = children[0] as string;
        const colorMatch = firstChild.match(/^\[([a-zA-Z]+)\]/);
        
        if (colorMatch && colorMatch[1]) {
            const colorName = colorMatch[1].toLowerCase();
            const text = firstChild.substring(colorMatch[0].length);
            
            const supportedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
            if (supportedColors.includes(colorName)) {
                // If there was text after the tag in the same node, use it.
                // Otherwise, the node is empty and we can remove it.
                if (text) {
                    children[0] = text;
                } else {
                    children.shift();
                }
                return <mark className={`mark-highlight mark-highlight-${colorName}`}>{children}</mark>;
            }
        }
    }

    // Default behavior for standard ==highlight== or unsupported colors
    return <mark className="mark-highlight mark-highlight-default">{props.children}</mark>;
};