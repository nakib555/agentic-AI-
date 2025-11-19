
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
import { ConfirmationModal } from '../UI/ConfirmationModal';

type AppModalsProps = {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  isMemoryModalOpen: boolean;
  setIsMemoryModalOpen: (isOpen: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (isOpen: boolean) => void;
  handleFileUploadForImport: (file: File) => void;
  onRunTests: () => void;
  onDownloadLogs: () => void;
  availableModels: Model[];
  availableImageModels: Model[];
  availableVideoModels: Model[];
  activeModel: string;
  onModelChange: (modelId: string) => void;
  modelsLoading: boolean;
  clearAllChats: () => void;
  // API Key
  apiKey: string;
  onSaveApiKey: (key: string) => Promise<void>;
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
  onImageModelChange: (modelId: string) => void;
  videoModel: string;
  onVideoModelChange: (modelId: string) => void;
  defaultTemperature: number;
  defaultMaxTokens: number;
  // Speech & Memory
  isMemoryEnabled: boolean;
  setIsMemoryEnabled: (enabled: boolean) => void;
  onManageMemory: () => void;
  memoryContent: string;
  clearMemory: () => void;
  updateBackendMemory: (content: string) => Promise<void>; // Added
  isConfirmationOpen: boolean;
  memorySuggestions: string[];
  confirmMemoryUpdate: () => void;
  cancelMemoryUpdate: () => void;
  ttsVoice: string;
  setTtsVoice: (value: string) => void;
  isAutoPlayEnabled: boolean;
  setIsAutoPlayEnabled: (enabled: boolean) => void;
  // Confirmation Modal
  confirmation: { prompt: string; onConfirm: () => void; onCancel?: () => void; destructive?: boolean } | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export const AppModals: React.FC<AppModalsProps> = (props) => {
  const {
    isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen, onRunTests,
    availableModels, availableImageModels, availableVideoModels, activeModel,
    onModelChange, modelsLoading, clearAllChats, aboutUser, setAboutUser,
    aboutResponse, setAboutResponse, temperature, setTemperature, maxTokens,
    setMaxTokens, imageModel, onImageModelChange, videoModel, onVideoModelChange,
    defaultTemperature, defaultMaxTokens, isMemoryEnabled,
    setIsMemoryEnabled, memoryContent, clearMemory, updateBackendMemory, isConfirmationOpen,
    memorySuggestions, confirmMemoryUpdate, cancelMemoryUpdate, ttsVoice,
    setTtsVoice, isAutoPlayEnabled, setIsAutoPlayEnabled, onManageMemory,
    apiKey, onSaveApiKey, isImportModalOpen, setIsImportModalOpen, handleFileUploadForImport,
    onDownloadLogs, confirmation, onConfirm, onCancel
  } = props;

  return (
    <>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        models={availableModels}
        imageModels={availableImageModels}
        videoModels={availableVideoModels}
        selectedModel={activeModel}
        onModelChange={onModelChange}
        disabled={modelsLoading}
        onClearAllChats={clearAllChats}
        onRunTests={onRunTests}
        onDownloadLogs={onDownloadLogs}
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
        onImageModelChange={onImageModelChange}
        videoModel={videoModel}
        onVideoModelChange={onVideoModelChange}
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
        onUpdateMemory={updateBackendMemory}
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
      <ConfirmationModal
        isOpen={!!confirmation}
        prompt={confirmation?.prompt || ''}
        onConfirm={onConfirm}
        onCancel={onCancel}
        destructive={confirmation?.destructive}
      />
    </>
  );
};
