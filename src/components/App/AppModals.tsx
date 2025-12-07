
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Model } from '../../services/modelService';
import type { MemoryFile } from '../../hooks/useMemory';
import type { Theme } from '../../hooks/useTheme';

// Static imports to ensure bundling works correctly in all environments
import { SettingsModal } from '../Settings/SettingsModal';
import { MemoryModal } from '../Settings/MemoryModal';
import { MemoryConfirmationModal } from '../Settings/MemoryConfirmationModal';
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
  onShowDataStructure: () => void;
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
  memoryFiles: MemoryFile[];
  clearMemory: () => void;
  updateBackendMemory: (content: string) => Promise<void>; 
  updateMemoryFiles: (files: MemoryFile[]) => Promise<void>;
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
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const AppModals: React.FC<AppModalsProps> = (props) => {
  const {
    isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen, onRunTests,
    availableModels, availableImageModels, availableVideoModels, activeModel,
    onModelChange, modelsLoading, clearAllChats, aboutUser, setAboutUser,
    aboutResponse, setAboutResponse, temperature, setTemperature, maxTokens,
    setMaxTokens, imageModel, onImageModelChange, videoModel, onVideoModelChange,
    defaultTemperature, defaultMaxTokens, isMemoryEnabled,
    setIsMemoryEnabled, memoryContent, memoryFiles, clearMemory, updateBackendMemory, updateMemoryFiles, isConfirmationOpen,
    memorySuggestions, confirmMemoryUpdate, cancelMemoryUpdate, ttsVoice,
    setTtsVoice, isAutoPlayEnabled, setIsAutoPlayEnabled, onManageMemory,
    apiKey, onSaveApiKey, isImportModalOpen, setIsImportModalOpen, handleFileUploadForImport,
    onDownloadLogs, onShowDataStructure, confirmation, onConfirm, onCancel,
    theme, setTheme
  } = props;

  return (
    <>
      {isSettingsOpen && (
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
          onShowDataStructure={onShowDataStructure}
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
          theme={theme}
          setTheme={setTheme}
        />
      )}
      
      {isMemoryModalOpen && (
        <MemoryModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
          memoryFiles={memoryFiles}
          onUpdateMemoryFiles={updateMemoryFiles}
        />
      )}

      {isConfirmationOpen && (
        <MemoryConfirmationModal
          isOpen={isConfirmationOpen}
          suggestions={memorySuggestions}
          onConfirm={confirmMemoryUpdate}
          onCancel={cancelMemoryUpdate}
        />
      )}

      {isImportModalOpen && (
        <ImportChatModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onFileUpload={handleFileUploadForImport}
        />
      )}

      {!!confirmation && (
        <ConfirmationModal
          isOpen={!!confirmation}
          prompt={confirmation?.prompt || ''}
          onConfirm={onConfirm}
          onCancel={onCancel}
          destructive={confirmation?.destructive}
        />
      )}
    </>
  );
};
