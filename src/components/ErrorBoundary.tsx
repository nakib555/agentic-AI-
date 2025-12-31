/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Automatically reset error state if children change (e.g., due to HMR, code edits, or parent re-render)
    if (this.state.hasError && this.props.children !== prevProps.children) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleReload = async () => {
    // Attempt to unregister service workers before reloading to fix potential cache issues
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
    } catch (e) {
      console.warn('Failed to unregister service workers during reload:', e);
    } finally {
      // Always reload, even if SW cleanup fails
      window.location.reload();
    }
  }

  private handleDismiss = () => {
    this.setState({ hasError: false, error: null });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-page p-4 text-center z-[9999]">
          <div className="bg-