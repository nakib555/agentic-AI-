
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

type NewChatButtonProps = {
  isCollapsed: boolean;
  isDesktop: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export const NewChatButton = ({ isCollapsed, isDesktop, onClick, disabled }: NewChatButtonProps) => {
  const shouldCollapse = isDesktop && isCollapsed;

  return (
    <div className="mb-2 px-2">
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                group relative w-full flex items-center transition-all duration-200
                ${disabled 
                    ? 'opacity-50 cursor-not-allowed bg-transparent' 
                    : 'hover:bg-gray-200/50 dark:hover:bg-white/5 cursor-pointer'
                }
                rounded-lg
                text-slate-700 dark:text-slate-200
                ${shouldCollapse 
                    ? 'justify-center p-2' 
                    : 'px-3 py-2'
                }
            `}
            title={disabled ? "Already in a new chat" : "New chat"}
            aria-label="New chat"
            aria-disabled={disabled}
        >
            <div className={`relative flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400 transition-colors ${!disabled && 'group-hover:text-slate-800 dark:group-hover:text-slate-100'}`}>
                {/* Square with Pencil Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
                </svg>
            </div>
            
            <motion.span
                className="font-medium text-sm whitespace-nowrap overflow-hidden"
                initial={false}
                animate={{ 
                    width: shouldCollapse ? 0 : 'auto', 
                    opacity: shouldCollapse ? 0 : 1,
                    marginLeft: shouldCollapse ? 0 : 12,
                }}
                transition={{ duration: 0.2 }}
            >
                New chat
            </motion.span>
        </button>
    </div>
  );
};
