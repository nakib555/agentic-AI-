/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

const DESKTOP_BREAKPOINT = 768; // Tailwind's 'md' breakpoint
const WIDE_DESKTOP_BREAKPOINT = 1280; // Tailwind's 'lg' breakpoint

/**
 * A custom hook that tracks viewport size categories.
 * @returns An object containing `isDesktop` and `isWideDesktop`.
 */
export const useViewport = () => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= DESKTOP_BREAKPOINT);
    const [isWideDesktop, setIsWideDesktop] = useState(window.innerWidth >= WIDE_DESKTOP_BREAKPOINT);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
            setIsWideDesktop(window.innerWidth >= WIDE_DESKTOP_BREAKPOINT);
        };

        window.addEventListener('resize', handleResize);
        
        // Cleanup the event listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array ensures this effect runs only once

    return { isDesktop, isWideDesktop };
};
