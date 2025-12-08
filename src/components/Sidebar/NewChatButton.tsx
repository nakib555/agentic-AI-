
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
                group relative w-full flex items-center transition-all duration-300
                ${disabled 
                    ? 'opacity-50 cursor-not-allowed bg-transparent' 
                    : 'bg-white/50 dark:bg-white/5 hover:bg-gradient-to-r hover:from-violet-500 hover:to-indigo-500 hover:text-white shadow-sm hover:shadow-md cursor-pointer border border-indigo-100/50 dark:border-white/10 hover:border-transparent'
                }
                rounded-xl
                text-slate-700 dark:text-slate-200
                ${shouldCollapse 
                    ? 'justify-center p-2' 
                    : 'px-3 py-2.5'
                }
            `}
            title={disabled ? "Already in a new chat" : "New chat"}
            aria-label="New chat"
            aria-disabled={disabled}
        >
            <div className={`relative flex items-center justify-center flex-shrink-0 transition-colors ${!disabled ? 'text-indigo-500 dark:text-indigo-400 group-hover:text-white' : 'text-slate-400'}`}>
                {/* Square with Pencil Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
                </svg>
            </div>
            
            <motion.span
                className="font-semibold text-sm whitespace-nowrap overflow-hidden"
                initial={false}
                animate={{ 
                    width: shouldCollapse ? 0 : 'auto', 
                    opacity: shouldCollapse ? 0 : 1,
                    marginLeft: shouldCollapse ? 0 : 12,
                }}
                transition={{ duration: 0.2 }}
                style={{ willChange: "width, margin-left, opacity" }}
            >
                New chat
            </motion.span>
        </button>
    </div>
  );
};
