
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import type { Message, Source } from '../../types';
import { MessageComponent } from './Message';
import { WelcomeScreen } from './WelcomeScreen/index';
import type { MessageFormHandle } from './MessageForm/index';
import { AnimatePresence, motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

export type MessageListHandle = {
  scrollToBottom: () => void;
  scrollToMessage: (messageId: string) => void;
};

type MessageListProps = {
  messages: Message[];
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
  isLoading: boolean;
  ttsVoice: string;
  ttsModel: string;
  currentChatId: string | null;
  onShowSources: (sources: Source[]) => void;
  approveExecution: (editedPlan: string) => void;
  denyExecution: () => void;
  messageFormRef: React.RefObject<MessageFormHandle>;
  onRegenerate: (messageId: string) => void;
  onSetActiveResponseIndex: (messageId: string, index: number) => void;
  isAgentMode: boolean;
};

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(({ 
    messages, sendMessage, isLoading, ttsVoice, ttsModel, currentChatId, 
    onShowSources, approveExecution, 
    denyExecution, messageFormRef, onRegenerate, onSetActiveResponseIndex,
    isAgentMode
}, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // We use a ref for this state to access it immediately inside event handlers/observers without stale closures
  const userHasScrolledUpRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Threshold (px) to consider the user "at the bottom"
  const BOTTOM_THRESHOLD = 100;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ 
        top: scrollContainerRef.current.scrollHeight, 
        behavior 
      });
      // Reset manual scroll tracking when we force a scroll
      userHasScrolledUpRef.current = false;
      setShowScrollButton(false);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => scrollToBottom('smooth'),
    scrollToMessage: (messageId: string) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-jump');
            setTimeout(() => {
                element.classList.remove('highlight-jump');
            }, 2000);
            // Determine if this action moved us away from bottom
            // We give a small delay to let the scroll happen before checking
            setTimeout(handleScroll, 500); 
        }
    }
  }));

  // Handle scroll events to detect if user is moving away from bottom
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    const isAtBottom = distanceFromBottom < BOTTOM_THRESHOLD;

    if (isAtBottom) {
        if (userHasScrolledUpRef.current) {
            userHasScrolledUpRef.current = false;
            setShowScrollButton(false);
        }
    } else {
        if (!userHasScrolledUpRef.current) {
            userHasScrolledUpRef.current = true;
            // Only show button if there's actually somewhere to scroll to
            if (scrollHeight > clientHeight) {
                setShowScrollButton(true);
            }
        }
    }
  }, []);

  // ResizeObserver handles streaming content pushing the scroll down
  useEffect(() => {
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    
    if (!container || !content) return;

    const observer = new ResizeObserver(() => {
        // Only auto-scroll if the user hasn't manually scrolled up
        if (!userHasScrolledUpRef.current) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    });

    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  // Force scroll to bottom on new message addition (user or AI start)
  useEffect(() => {
      // If a new message is added, we generally want to snap to it unless the user is deep in history.
      // However, for the very start of a generation (isLoading becomes true), we always snap.
      if (isLoading) {
          userHasScrolledUpRef.current = false;
          scrollToBottom();
      } else if (!userHasScrolledUpRef.current) {
          scrollToBottom();
      }
  }, [messages.length, isLoading, scrollToBottom]);

  // Initial scroll on mount
  useEffect(() => {
      scrollToBottom('auto');
  }, []); 

  const visibleMessages = messages.filter(msg => !msg.isHidden);

  return (
    <div 
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative custom-scrollbar overscroll-contain" 
        ref={scrollContainerRef} 
        onScroll={handleScroll}
    >
      <div 
        ref={contentRef}
        className={`min-h-full flex w-full justify-center px-4 sm:px-6 md:px-8 ${visibleMessages.length > 0 ? 'items-start' : 'items-center'}`}
      >
        {visibleMessages.length === 0 ? (
          <WelcomeScreen sendMessage={sendMessage} />
        ) : (
          <div className="space-y-8 md:space-y-10 py-4 w-full" role="log" aria-live="polite">
            {visibleMessages.map((msg) => (
              <MessageComponent 
                  key={msg.id} 
                  msg={msg} 
                  isLoading={isLoading}
                  sendMessage={sendMessage} 
                  ttsVoice={ttsVoice} 
                  ttsModel={ttsModel}
                  currentChatId={currentChatId}
                  onShowSources={onShowSources}
                  approveExecution={approveExecution}
                  denyExecution={denyExecution}
                  messageFormRef={messageFormRef}
                  onRegenerate={onRegenerate}
                  onSetActiveResponseIndex={onSetActiveResponseIndex}
                  isAgentMode={isAgentMode}
              />
            ))}
            {/* Padding element to ensure the last message isn't hidden behind the input area or scroll button */}
            <div className="h-4" />
          </div>
        )}
      </div>

      {/* Floating Scroll Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
             initial={{ opacity: 0, y: 20, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.9 }}
             transition={{ type: "spring", stiffness: 400, damping: 30 }}
             className="sticky bottom-6 inset-x-0 flex justify-center pointer-events-none z-30 pb-2"
          >
            <button
                onClick={() => scrollToBottom('smooth')}
                className="pointer-events-auto group flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-sm font-medium text-gray-700 dark:text-gray-200 shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-white/10 rounded-full transition-all transform hover:-translate-y-0.5 active:scale-95 ring-1 ring-black/5 dark:ring-white/5"
                aria-label="Scroll to latest messages"
            >
                {isLoading && (
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                )}
                <span>Latest Messages</span>
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
