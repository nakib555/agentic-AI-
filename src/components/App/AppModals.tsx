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
import { ImportChatModal } from '../Settings/ImportChatModal';

type AppModalsProps = {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  isMemoryModalOpen: boolean;
  setIsMemoryModalOpen: (isOpen: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (isOpen: boolean) => void;
  handleFileUploadForImport: (file: File) => void;
  onRunTests: () => void;
  availableModels: Model[];
  activeModel: string;
  handleModelChange: (modelId: string) => void;
  modelsLoading: boolean;
  clearAllChats: () => void;
  // API Key
  apiKey: string;
  // Fix: Rename prop from setApiKey to onSaveApiKey to match parent component.
  onSaveApiKey: (key: string) => void;
  // Custom Instructions
  aboutUser: string;
  setAboutUser: (value: string) => void;
  aboutResponse: string;
  setAboutResponse: (value: string) => void;
  // Model Settings
  temperature: number;
  setTemperature: (value: number) => void;
  maxTokens: number;
  setMaxTokens: (value: number) => void;
  imageModel: string;
  setImageModel: (modelId: string) => void;
  videoModel: string;
  setVideoModel: (modelId: string) => void;
  defaultTemperature: number;
  defaultMaxTokens: number;
  // Speech & Memory
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
};

export const AppModals: React.FC<AppModalsProps> = (props) => {
  const {
    isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen, onRunTests,
    availableModels, activeModel,
    handleModelChange, modelsLoading, clearAllChats, aboutUser, setAboutUser,
    aboutResponse, setAboutResponse, temperature, setTemperature, maxTokens,
    setMaxTokens, imageModel, setImageModel, videoModel, setVideoModel,
    defaultTemperature, defaultMaxTokens, isMemoryEnabled,
    setIsMemoryEnabled, memoryContent, clearMemory, isConfirmationOpen,
    memorySuggestions, confirmMemoryUpdate, cancelMemoryUpdate, ttsVoice,
    setTtsVoice, isAutoPlayEnabled, setIsAutoPlayEnabled, onManageMemory,
    apiKey, onSaveApiKey, isImportModalOpen, setIsImportModalOpen, handleFileUploadForImport
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
        onRunTests={onRunTests}
        apiKey={apiKey}
        onSaveApiKey={onSaveApiKey}
        aboutUser={aboutUser}
        setAboutUser={setAboutUser}
        aboutResponse={aboutResponse}
        setAboutResponse={setAboutResponse}
        temperature={temperature}
        setTemperature={setTemperature}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        imageModel={imageModel}
        onImageModelChange={setImageModel}
        videoModel={videoModel}
        onVideoModelChange={setVideoModel}
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
      <ImportChatModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onFileUpload={handleFileUploadForImport}
      />
    </>
  );
};
