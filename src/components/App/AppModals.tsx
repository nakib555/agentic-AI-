
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import type { Model } from '../../types';
import type { MemoryFile } from '../../hooks/useMemory';
import type { Theme } from '../../hooks/useTheme';

// Lazy load ALL modals to optimize bundle size and startup time
// This ensures the main chat loads instantly, while settings/tools load in background
const SettingsModal = React.lazy(() => import('../Settings/SettingsModal').then(module => ({ default: module.SettingsModal })));
const MemoryModal = React.lazy(() => import('../Settings/MemoryModal').then(module => ({ default: module.MemoryModal })));
const MemoryConfirmationModal = React.lazy(() => import('../Settings/MemoryConfirmationModal').then(module => ({ default: module.MemoryConfirmationModal })));
const ImportChatModal = React.lazy(() => import('../Settings/ImportChatModal').then(module => ({ default: module.ImportChatModal })));
const ConfirmationModal = React.lazy(() => import('../UI/ConfirmationModal').then(module => ({ default: module.ConfirmationModal })));

type AppModalsProps = {
  isDesktop: boolean;
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
  availableTtsModels: Model[];
  activeModel: string;
  onModelChange: (modelId: string) => void;
  modelsLoading: boolean;
  clearAllChats: () => void;
  // API Keys
  apiKey: string;
  onSaveApiKey: (key: string) => Promise<void>;
  suggestionApiKey: string;
  onSaveSuggestionApiKey: (key: string) => void;
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
  ttsModel: string;
  onTtsModelChange: (modelId: string) => void;
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
    isSettingsOpen,
    isMemoryModalOpen,
    setIsMemoryModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    handleFileUploadForImport,
    memoryFiles,
    updateMemoryFiles,
    isConfirmationOpen,
    memorySuggestions,
    confirmMemoryUpdate,
    cancelMemoryUpdate,
    confirmation,
    onConfirm,
    onCancel,
  } = props;

  // Nothing to render if no modal is active
  if (!isSettingsOpen && !isMemoryModalOpen && !isImportModalOpen && !isConfirmationOpen && !confirmation) {
    return null;
  }

  // Use a transparent fallback to avoid layout shift during lazy load
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100]" />}>
      {isSettingsOpen && (
        <SettingsModal
          isOpen={props.isSettingsOpen}
          onClose={() => props.setIsSettingsOpen(false)}
          models={props.availableModels}
          imageModels={props.availableImageModels}
          videoModels={props.availableVideoModels}
          ttsModels={props.availableTtsModels}
          selectedModel={props.activeModel}
          onModelChange={props.onModelChange}
          disabled={props.modelsLoading}
          onClearAllChats={props.clearAllChats}
          onRunTests={props.onRunTests}
          onDownloadLogs={props.onDownloadLogs}
          onShowDataStructure={props.onShowDataStructure}
          apiKey={props.apiKey}
          onSaveApiKey={props.onSaveApiKey}
          suggestionApiKey={props.suggestionApiKey}
          onSaveSuggestionApiKey={props.onSaveSuggestionApiKey}
          aboutUser={props.aboutUser}
          setAboutUser={props.setAboutUser}
          aboutResponse={props.aboutResponse}
          setAboutResponse={props.setAboutResponse}
          temperature={props.temperature}
          setTemperature={props.setTemperature}
          maxTokens={props.maxTokens}
          setMaxTokens={props.setMaxTokens}
          imageModel={props.imageModel}
          onImageModelChange={props.onImageModelChange}
          videoModel={props.videoModel}
          onVideoModelChange={props.onVideoModelChange}
          ttsModel={props.ttsModel}
          onTtsModelChange={props.onTtsModelChange}
          defaultTemperature={props.defaultTemperature}
          defaultMaxTokens={props.defaultMaxTokens}
          isMemoryEnabled={props.isMemoryEnabled}
          setIsMemoryEnabled={props.setIsMemoryEnabled}
          onManageMemory={props.onManageMemory}
          ttsVoice={props.ttsVoice}
          setTtsVoice={props.setTtsVoice}
          theme={props.theme}
          setTheme={props.setTheme}
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
    </Suspense>
  );
};
