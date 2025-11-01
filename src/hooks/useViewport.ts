/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

const DESKTOP_BREAKPOINT = 768; // Tailwind's 'md' breakpoint

/**
 * A custom hook that tracks whether the viewport is desktop-sized.
 * @returns An object containing `isDesktop`.
 */
export const useViewport = () => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= DESKTOP_BREAKPOINT);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
        };

        window.addEventListener('resize', handleResize);
        
        // Cleanup the event listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array ensures this effect runs only once

    return { isDesktop };
};
