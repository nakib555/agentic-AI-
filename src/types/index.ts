/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Fix: Add global type definition for the <dotlottie-wc> custom element
// to make it available to TypeScript's JSX parser across the app.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        loop?: boolean;
        autoplay?: boolean;
      }, HTMLElement>;
    }
  }
}

export * from './error';
export * from './message';
export * from './chat';
export * from './workflow';