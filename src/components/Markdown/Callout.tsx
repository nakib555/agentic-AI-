/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type CalloutProps = {
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  children: React.ReactNode;
};

export const Callout = ({ type, title, children }: CalloutProps) => (
  <div className={`callout callout-${type}`}>
    {title && <p className="callout-title">{title}</p>}
    <div>{children}</div>
  </div>
);