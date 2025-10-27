/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts a File object to a base64 encoded string, stripping the data URL prefix.
 * @param file The file to convert.
 * @returns A promise that resolves with the base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:mime/type;base64,the-base64-string"
      // we need to strip the prefix
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file as base64 string."));
      }
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Converts a base64 string back into a File object.
 * @param base64 The base64 encoded string (without the data URL prefix).
 * @param filename The name of the file.
 * @param mimeType The MIME type of the file.
 * @returns A File object.
 */
export const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
};