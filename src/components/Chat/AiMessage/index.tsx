/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { motion as motionTyped, AnimatePresence } from 'framer-motion';
const motion = motionTyped as any;
import type { Message } from '../../../types';
import { MarkdownComponents } from '../../Markdown/markdownComponents';
import { ErrorDisplay } from '../../UI/ErrorDisplay';
import { ImageDisplay } from '../../AI/ImageDisplay';
import { VideoDisplay } from '../../AI/VideoDisplay';
import { ManualCodeRenderer } from '../../Markdown/ManualCodeRenderer';
import { TypingIndicator } from '../TypingIndicator';
import { TypingWrapper } from '../../AI/TypingWrapper';
import { McqComponent } from '../../AI/McqComponent';
import { MapDisplay } from '../../AI/MapDisplay';
import { FileAttachment } from '../../AI/FileAttachment';
import { SuggestedActions } from '../SuggestedActions';
import { ExecutionApproval } from '../../AI/ExecutionApproval';
import type { MessageFormHandle } from '../MessageForm/index';
import { useAiMessageLogic } from './useAiMessageLogic';
import { MessageToolbar } from './MessageToolbar';

const animationProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

type AiMessageProps = { 
    msg: Message;
    isLoading: boolean;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void; 
    ttsVoice: string; 
    isAutoPlayEnabled: boolean;
    currentChatId: string | null;
    onShowThinkingProcess: (messageId: string) => void;
    approveExecution: (editedPlan: string) => void;
    denyExecution: () => void;
    messageFormRef: React.RefObject<MessageFormHandle>;
    onRegenerate: (messageId: string) => void;
    onSetActiveResponseIndex: (messageId: string, index: number) => void;
    isAgentMode: boolean;
};

export const AiMessage: React.FC<AiMessageProps> = (props) => {
  const { msg, isLoading, sendMessage, ttsVoice, isAutoPlayEnabled, currentChatId, 
          onShowThinkingProcess, approveExecution, denyExecution, messageFormRef, onRegenerate,
          onSetActiveResponseIndex, isAgentMode } = props;
  const { id } = msg;

  const logic = useAiMessageLogic(msg, isAutoPlayEnabled, ttsVoice, sendMessage, isLoading);
  const { activeResponse } = logic;

  const renderProgressiveAnswer = useCallback((txt: string, isStreaming: boolean) => {
    const componentRegex = /(\[(?:VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT)\].*?\[\/(?:VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT)\])/s;
    const parts = txt.split(componentRegex).filter(part => part);

    return parts.map((part, index) => {
        const key = `${id}-${index}`;
        const renderError = (comp: string, details: string) => <ErrorDisplay key={key} error={{ message: `Failed to render ${comp}`, details }} />;
        const handleEdit = (blob: Blob, editKey: string) => {
            const file = new File([blob], "image-to-edit.png", { type: blob.type });
            (file as any)._editKey = editKey;
            messageFormRef.current?.attachFiles([file]);
        };
        
        try {
            const videoMatch = part.match(/\[VIDEO_COMPONENT\](\{.*?\})\[\/VIDEO_COMPONENT\]/s);
            if (videoMatch) return <VideoDisplay key={key} {...JSON.parse(videoMatch[1])} />;
            
            const onlineVideoMatch = part.match(/\[ONLINE_VIDEO_COMPONENT\](\{.*?\})\[\/ONLINE_VIDEO_COMPONENT\]/s);
            if (onlineVideoMatch) {
                const data = JSON.parse(onlineVideoMatch[1]);
                return <VideoDisplay key={key} srcUrl={data.url} prompt={data.title} />;
            }

            const imageMatch = part.match(/\[IMAGE_COMPONENT\](\{.*?\})\[\/IMAGE_COMPONENT\]/s);
            if (imageMatch) return <ImageDisplay key={key} onEdit={handleEdit} {...JSON.parse(imageMatch[1])} />;

            const onlineImageMatch = part.match(/\[ONLINE_IMAGE_COMPONENT\](\{.*?\})\[\/ONLINE_IMAGE_COMPONENT\]/s);
            if (onlineImageMatch) return <ImageDisplay key={key} onEdit={handleEdit} {...JSON.parse(onlineImageMatch[1])} />;

            const mcqMatch = part.match(/\[MCQ_COMPONENT\](\{.*?\})\[\/MCQ_COMPONENT\]/s);
            if (mcqMatch) return <McqComponent key={key} {...JSON.parse(mcqMatch[1])} />;

            const mapMatch = part.match(/\[MAP_COMPONENT\](\{.*?\})\[\/MAP_COMPONENT\]/s);
            if (mapMatch) return <motion.div key={key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}><MapDisplay {...JSON.parse(mapMatch[1])} /></motion.div>;
            
            const fileAttachmentMatch = part.match(/\[FILE_ATTACHMENT_COMPONENT\](\{.*?\})\[\/FILE_ATTACHMENT_COMPONENT\]/s);
            if (fileAttachmentMatch) return <FileAttachment key={key} {...JSON.parse(fileAttachmentMatch[1])} />;

        } catch (e: any) {
            return renderError('component', e.message);
        }
        
        const incompleteTagRegex = /\[(VIDEO_COMPONENT|ONLINE_VIDEO_COMPONENT|IMAGE_COMPONENT|ONLINE_IMAGE_COMPONENT|MCQ_COMPONENT|MAP_COMPONENT|FILE_ATTACHMENT_COMPONENT)\].*$/s;
        const cleanedPart = part.replace(incompleteTagRegex, '');

        if (cleanedPart) {
            return <ManualCodeRenderer key={key} text={cleanedPart} components={MarkdownComponents} isStreaming={isStreaming} onRunCode={isAgentMode ? logic.handleRunCode : undefined} isRunDisabled={isLoading} />;
        }
        return null;
    });
  }, [id, logic.handleRunCode, isLoading, messageFormRef, isAgentMode]);

  if (logic.isInitialWait) return <TypingIndicator />;

  if (logic.showApprovalUI && activeResponse?.plan) {
    return <ExecutionApproval plan={activeResponse.plan} onApprove={approveExecution} onDeny={denyExecution} />;
  }

  return (
    <motion.div {...animationProps} className="w-full flex flex-col items-start gap-4">
      {logic.hasThinkingProcess && (
        <button
            onClick={() => onShowThinkingProcess(id)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700/50 transition-colors text-left"
        >
            <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 dark:text-slate-400"><path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 4.207a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm9.586 0a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 15.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm0-1.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" clipRule="evenodd" /></svg>
                <span className="font-semibold text-gray-700 dark:text-slate-200 text-sm">
                    {logic.thinkingIsComplete ? `Thought took ${logic.displayDuration}s` : `Thinking for ${logic.displayDuration}s`}
                </span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 dark:text-slate-400"><path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L12.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
        </button>
      )}
      
      {(logic.hasFinalAnswer || activeResponse?.error || logic.isWaitingForFinalAnswer) && (
        <div className="w-full flex flex-col gap-4">
          {logic.isWaitingForFinalAnswer && <TypingIndicator />}
          {activeResponse?.error && <ErrorDisplay error={activeResponse.error} />}
          {logic.hasFinalAnswer && !activeResponse?.error && (
              <div className="markdown-content max-w-none w-full">
                  <TypingWrapper fullText={logic.finalAnswerText} isAnimating={logic.isStreamingFinalAnswer}>
                    {(displayedText) => renderProgressiveAnswer(logic.isStreamingFinalAnswer ? displayedText : logic.finalAnswerText, logic.isStreamingFinalAnswer)}
                  </TypingWrapper>
              </div>
          )}
        </div>
      )}
      
      {logic.thinkingIsComplete && logic.hasFinalAnswer && !activeResponse?.error && (
          <MessageToolbar
            messageId={id}
            messageText={logic.finalAnswerText}
            rawText={activeResponse?.text || ''}
            sources={logic.searchSources}
            ttsState={logic.audioState}
            onTtsClick={logic.playOrStopAudio}
            onRegenerate={() => onRegenerate(id)}
            responseCount={msg.responses?.length || 0}
            activeResponseIndex={msg.activeResponseIndex}
            onResponseChange={(index) => onSetActiveResponseIndex(id, index)}
          />
      )}

      {logic.thinkingIsComplete && activeResponse?.suggestedActions && activeResponse.suggestedActions.length > 0 && !activeResponse.error && (
         <div className="w-full"><SuggestedActions actions={activeResponse.suggestedActions} onActionClick={sendMessage} /></div>
      )}
    </motion.div>
  );
};