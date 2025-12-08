
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
    
    // Modern button styles
    const baseClasses = `w-full flex items-center px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-200 group relative overflow-hidden`;
    
    // Active state with subtle gradient background and emphasized text
    const activeClasses = `bg-gradient-to-br from-primary-main/10 to-primary-main/5 text-primary-main font-semibold shadow-sm border border-primary-main/10`;
    
    // Inactive state with hover effect
    const inactiveClasses = `text-content-secondary hover:bg-layer-2 hover:text-content-primary`;

    const disabledClasses = `opacity-50 cursor-not-allowed`;
    const layoutClasses = shouldCollapse ? 'justify-center' : '';

    return (
        <div className="relative">
            <motion.button 
                onClick={onClick} 
                disabled={disabled}
                className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${layoutClasses} ${disabled ? disabledClasses : ''}`}
                whileHover={!disabled ? { scale: 1.02 } : {}}
                whileTap={!disabled ? { scale: 0.98 } : {}}
            >
                <div className={`flex-shrink-0 w-5 h-5 transition-colors ${active ? 'text-primary-main' : 'text-content-tertiary group-hover:text-content-primary'}`}>
                    {icon}
                </div>
                
                <motion.span 
                    className="overflow-hidden"
                    initial={false}
                    animate={{ 
                        width: shouldCollapse ? 0 : 'auto', 
                        opacity: shouldCollapse ? 0 : 1, 
                        x: shouldCollapse ? -10 : 0,
                        marginLeft: shouldCollapse ? 0 : 12 
                    }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
                >
                    {text}
                </motion.span>
                
                {active && !shouldCollapse && (
                    <motion.div 
                        layoutId="nav-indicator"
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-main rounded-l-full"
                    />
                )}
            </motion.button>
            
            {/* Tooltip for collapsed state */}
            {shouldCollapse && !disabled && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-layer-2 text-content-primary text-xs font-semibold rounded-lg shadow-xl border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 transform translate-x-[-10px] group-hover:translate-x-0 duration-200">
                    {text}
                </div>
            )}
        </div>
    );
};
