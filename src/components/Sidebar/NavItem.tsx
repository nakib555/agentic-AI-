
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

type NavItemProps = { 
    icon: React.ReactNode;
    text: string;
    active?: boolean;
    isCollapsed: boolean;
    isDesktop: boolean;
    onClick: () => void;
    disabled?: boolean;
};

export const NavItem = ({ icon, text, active, isCollapsed, isDesktop, onClick, disabled }: NavItemProps) => {
    const shouldCollapse = isDesktop && isCollapsed;
    const [isHovered, setIsHovered] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    const baseClasses = `
        group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left 
        transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
    `;
    
    const activeClasses = `
        bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 font-semibold shadow-sm ring-1 ring-slate-200 dark:ring-white/5
    `;
    const inactiveClasses = `
        text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200
    `;

    const disabledClasses = `opacity-50 cursor-not-allowed`;
    const layoutClasses = shouldCollapse ? 'justify-center px-2' : '';

    return (
        <>
            <button 
                ref={buttonRef}
                onClick={onClick} 
                disabled={disabled}
                className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${layoutClasses} ${disabled ? disabledClasses : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors ${active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
                    {icon}
                </div>
                
                <motion.span 
                    className="text-sm truncate leading-none"
                    initial={false}
                    animate={{ 
                        width: shouldCollapse ? 0 : 'auto', 
                        opacity: shouldCollapse ? 0 : 1, 
                        display: shouldCollapse ? 'none' : 'block'
                    }}
                    transition={{ duration: 0.2 }}
                >
                    {text}
                </motion.span>
            </button>

            {/* Tooltip Portal */}
            {shouldCollapse && !disabled && isHovered && buttonRef.current && createPortal(
                <div 
                    className="fixed z-[100] px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                    style={{ 
                        top: buttonRef.current.getBoundingClientRect().top + buttonRef.current.getBoundingClientRect().height / 2, 
                        left: buttonRef.current.getBoundingClientRect().right + 12,
                        transform: 'translateY(-50%)'
                    }}
                >
                    {text}
                    {/* Tiny arrow */}
                    <div className="absolute top-1/2 right-full -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-slate-800"></div>
                </div>,
                document.body
            )}
        </>
    );
};
