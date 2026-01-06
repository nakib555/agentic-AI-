
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, forwardRef, useImperativeHandle, useCallback, useMemo, Suspense, useEffect, useLayoutEffect } from 'react';
import type { Message, Source } from '../../types';
import { MessageComponent } from './Message';
import type { MessageFormHandle } from './MessageForm/index';
import { AnimatePresence, motion as motionTyped } from 'framer-motion';
import { useViewport } from '../../hooks/useViewport';

const motion = motionTyped as any;

// Safe lazy loads
const ChatSkeleton = React.lazy(() => import('../UI/ChatSkeleton').then(m => ({ default: m.ChatSkeleton })));
const WelcomeScreen = React.lazy(() => import('./WelcomeScreen/index').then(m => ({ default: m.WelcomeScreen })));

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
  onEditMessage?: (messageId: string, newText: string) => void;
  onNavigateBranch?: (messageId: string, direction: 'next' | 'prev') => void;
};

// Wrapper to inject context (like previous user message)
const MessageWrapper: React.FC<{ 
    msg: Message;
    index: number;
    messages: Message[];
    props: Omit<MessageListProps, 'messages'>;
}> = ({ msg, index, messages, props }) => {
    // Determine context for AI messages (the prompt that triggered it)
    let userQuery = '';
    if (msg.role === 'model') {
        // Find the most recent user message before this one
        for (let i = index - 1; i >= 0; i--) {
            if (messages[i].role === 'user' && !messages[i].isHidden) {
                userQuery = messages[i].text;
                break;
            }
        }
    }

    return (
        <MessageComponent 
            key={msg.id} 
            msg={msg} 
            {...props}
            // Pass the custom prop to AiMessage via MessageComponent
            {...({ userQuery } as any)} 
        />
    );
};

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(({ 
    messages, sendMessage, isLoading, ttsVoice, ttsModel, currentChatId, 
    onShowSources, approveExecution, 
    denyExecution, messageFormRef, onRegenerate, onSetActiveResponseIndex,
    isAgentMode, onEditMessage, onNavigateBranch
}, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const { isDesktop } = useViewport();

  // Safeguard against undefined messages prop
  const visibleMessages = useMemo(() => (messages || []).filter(msg => !msg.isHidden), [messages]);
  
  // Track previous length to detect new messages
  const prevMessagesLength = useRef(visibleMessages.length);

  // Auto-scroll logic
  useLayoutEffect(() => {
      const currentLength = visibleMessages.length;
      const prevLength = prevMessagesLength.current;
      const isNewMessage = currentLength > prevLength;
      
      // If we are already at the bottom OR a new message arrived from user, snap to bottom
      if (shouldAutoScroll || (isNewMessage && visibleMessages[currentLength - 1]?.role === 'user')) {
          bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      }
      
      prevMessagesLength.current = currentLength;
  }, [visibleMessages, shouldAutoScroll]);

  // Also scroll when isLoading changes to true (new response starting) if we were at bottom
  useEffect(() => {
      if (isLoading && shouldAutoScroll) {
           bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [isLoading, shouldAutoScroll]);

  // Handle manual scroll to toggle auto-scroll state
  const handleScroll = useCallback(() => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      
      // 50px threshold for determining if we are at the bottom
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
      
      setShouldAutoScroll(isAtBottom);
      setShowScrollButton(!isAtBottom);
  }, []);

  // Expose scroll methods to parent via ref
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      setShouldAutoScroll(true);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
    scrollToMessage: (messageId: string) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }));

  const handleScrollToBottomClick = useCallback(() => {
      setShouldAutoScroll(true);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="flex-1 min-h-0 relative w-full group">
      {visibleMessages.length === 0 ? (
        isLoading ? (
            // Show Skeleton when loading a chat (messages are empty but isLoading is true)
            <Suspense fallback={<div className="h-full w-full bg-transparent" />}>
                <ChatSkeleton />
            </Suspense>
        ) : (
            <div className="h-full overflow-y-auto custom-scrollbar">
                 <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-indigo-500 rounded-full border-t-transparent"></div></div>}>
                    <WelcomeScreen sendMessage={sendMessage} />
                 </Suspense>
            </div>
        )
      ) : (
        <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto custom-scrollbar scroll-smooth" 
            onScroll={handleScroll}
            role="log" 
            aria-live="polite"
        >
            <div className="flex flex-col pb-4">
                {visibleMessages.map((msg, index) => (
                    <div key={msg.id} className="px-4 sm:px-6 md:px-8 max-w-4xl mx-auto w-full py-2 sm:py-4">
                        <MessageWrapper 
                            msg={msg}
                            index={index}
                            messages={visibleMessages}
                            props={{
                                sendMessage, isLoading, ttsVoice, ttsModel, currentChatId,
                                onShowSources, approveExecution, denyExecution, messageFormRef,
                                onRegenerate, onSetActiveResponseIndex, isAgentMode, onEditMessage,
                                onNavigateBranch
                            }}
                        />
                    </div>
                ))}
                {/* Bottom Anchor */}
                <div ref={bottomRef} className="h-32 md:h-48 flex-shrink-0" />
            </div>
        </div>
      )}

      <AnimatePresence>
        {showScrollButton && (
          <motion.div
             initial={{ opacity: 0, y: 10, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 10, scale: 0.9 }}
             transition={{ type: "spring", stiffness: 400, damping: 30 }}
             className="absolute bottom-6 md:bottom-4 inset-x-0 flex justify-center pointer-events-none z-30"
          >
            <button
                onClick={handleScrollToBottomClick}
                className="pointer-events-auto group flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-xl hover:shadow-2xl border border-gray-200/50 dark:border-white/10 rounded-full transition-all transform hover:-translate-y-1 active:scale-95 ring-1 ring-black/5 dark:ring-white/5"
                aria-label="Scroll to latest messages"
            >
                {!shouldAutoScroll && isLoading && (
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                )}
                <span>Scroll to Bottom</span>
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
