/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 2 of 4 from src/components/App.tsx
// Lines 304-338

import React from 'react';
import { SettingsModal } from '../Settings/SettingsModal';
import { MemoryModal } from '../Settings/MemoryModal';
import { MemoryConfirmationModal } from '../Settings/MemoryConfirmationModal';
import type { Model } from '../../services/modelService';
import type { Message } from '../../types';

type AppModalsProps = {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  isMemoryModalOpen: boolean;
  setIsMemoryModalOpen: (isOpen: boolean) => void;
  isPinnedModalOpen: boolean;
  setIsPinnedModalOpen: (isOpen: boolean) => void;
  availableModels: Model[];
  activeModel: string;
  handleModelChange: (modelId: string) => void;
  modelsLoading: boolean;
  clearAllChats: () => void;
  aboutUser: string;
  setAboutUser: (value: string) => void;
  aboutResponse: string;
  setAboutResponse: (value: string) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  maxTokens: number;
  setMaxTokens: (value: number) => void;
  defaultTemperature: number;
  defaultMaxTokens: number;
  isMemoryEnabled: boolean;
  setIsMemoryEnabled: (enabled: boolean) => void;
  onManageMemory: () => void;
  memoryContent: string;
  clearMemory: () => void;
  isConfirmationOpen: boolean;
  memorySuggestions: string[];
  confirmMemoryUpdate: () => void;
  cancelMemoryUpdate: () => void;
  ttsVoice: string;
  setTtsVoice: (value: string) => void;
  isAutoPlayEnabled: boolean;
  setIsAutoPlayEnabled: (enabled: boolean) => void;
  messages: Message[];
  currentChatId: string | null;
  toggleMessagePin: (chatId: string, messageId: string) => void;
  handleJumpToMessage: (messageId: string) => void;
};

export const AppModals: React.FC<AppModalsProps> = (props) => {
  const {
    isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen,
    isPinnedModalOpen, setIsPinnedModalOpen, availableModels, activeModel,
    handleModelChange, modelsLoading, clearAllChats, aboutUser, setAboutUser,
    aboutResponse, setAboutResponse, temperature, setTemperature, maxTokens,
    setMaxTokens, defaultTemperature, defaultMaxTokens, isMemoryEnabled,
    setIsMemoryEnabled, memoryContent, clearMemory, isConfirmationOpen,
    memorySuggestions, confirmMemoryUpdate, cancelMemoryUpdate, ttsVoice,
    setTtsVoice, isAutoPlayEnabled, setIsAutoPlayEnabled, messages,
    currentChatId, toggleMessagePin, handleJumpToMessage, onManageMemory,
  } = props;

  return (
    <>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        models={availableModels}
        selectedModel={activeModel}
        onModelChange={handleModelChange}
        disabled={modelsLoading}
        onClearAllChats={clearAllChats}
        aboutUser={aboutUser}
        setAboutUser={setAboutUser}
        aboutResponse={aboutResponse}
        setAboutResponse={setAboutResponse}
        temperature={temperature}
        setTemperature={setTemperature}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        defaultTemperature={defaultTemperature}
        defaultMaxTokens={defaultMaxTokens}
        isMemoryEnabled={isMemoryEnabled}
        setIsMemoryEnabled={setIsMemoryEnabled}
        onManageMemory={onManageMemory}
        ttsVoice={ttsVoice}
        setTtsVoice={setTtsVoice}
        isAutoPlayEnabled={isAutoPlayEnabled}
        setIsAutoPlayEnabled={setIsAutoPlayEnabled}
      />
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memoryContent={memoryContent}
        onClearMemory={clearMemory}
      />
      <MemoryConfirmationModal
        isOpen={isConfirmationOpen}
        suggestions={memorySuggestions}
        onConfirm={confirmMemoryUpdate}
        onCancel={cancelMemoryUpdate}
      />
    </>
  );
};
