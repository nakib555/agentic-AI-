/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DownloadLink } from './DownloadLink';
import { FilePreview } from './FilePreview';

type FileAttachmentProps = {
  filename: string;
  fileKey: string;
  mimeType: string;
};

const PREVIEWABLE_MIMETYPES = [
    'image/png', 
    'image/jpeg', 
    'image/gif', 
    'image/svg+xml', 
    'image/webp',
    'application/pdf',
    'text/html'
];

export const FileAttachment: React.FC<FileAttachmentProps> = ({ filename, fileKey, mimeType }) => {
  if (PREVIEWABLE_MIMETYPES.includes(mimeType)) {
    return <FilePreview filename={filename} fileKey={fileKey} mimeType={mimeType} />;
  }
  return <DownloadLink filename={filename} fileKey={fileKey} />;
};