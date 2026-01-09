
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

const DESKTOP_BREAKPOINT = 768; // Tailwind's 'md' breakpoint
const WIDE_DESKTOP_BREAKPOINT = 1280; // Tailwind's 'lg' breakpoint

/**
 * A custom hook that tracks viewport size categories.
 * @returns An object containing `isDesktop`, `isWideDesktop`, and `visualViewportHeight`.
 */
export const useViewport = () => {
    const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true);
    const [isWideDesktop, setIsWideDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= WIDE_DESKTOP_BREAKPOINT : true);
    const [visualViewportHeight, setVisualViewportHeight] = useState(typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 0);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
            setIsWideDesktop(window.innerWidth >= WIDE_DESKTOP_BREAKPOINT);
        };

        const handleVisualResize = () => {
             // We only care about this on mobile where virtual keyboards affect layout
             if (window.visualViewport && window.innerWidth < DESKTOP_BREAKPOINT) {
                 setVisualViewportHeight(window.visualViewport.height);
                 // CRITICAL: Force the browser back to the top-left corner.
                 // When the keyboard opens, browsers often try to scroll the document to keep inputs in view.
                 // Since we manage the layout manually with visualViewport height, this native scroll results
                 // in the top of the app being pushed off-screen.
                 window.scrollTo(0, 0);
             }
        };

        // Aggressively prevent window scrolling on mobile (fixes "drag to up" issue)
        const handleScroll = () => {
             if (window.innerWidth < DESKTOP_BREAKPOINT && (window.scrollY !== 0 || window.scrollX !== 0)) {
                 window.scrollTo(0, 0);
             }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);
        
        // Visual Viewport API for accurate mobile layout with keyboard
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleVisualResize);
            // Initial read
            if (window.innerWidth < DESKTOP_BREAKPOINT) {
                setVisualViewportHeight(window.visualViewport.height);
            }
        }
        
        // Cleanup the event listener on component unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleVisualResize);
            }
        };
    }, []); 

    return { isDesktop, isWideDesktop, visualViewportHeight };
};
