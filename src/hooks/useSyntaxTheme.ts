
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const useSyntaxTheme = () => {
  const [style, setStyle] = useState(vscDarkPlus);

  useEffect(() => {
    const update = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setStyle(isDark ? vscDarkPlus : oneLight);
    };

    update(); // Initial check

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return style;
};
