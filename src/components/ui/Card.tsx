/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export const Card = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div 
    className={`glass rounded-[2rem] p-6 border-white/60 shadow-xl ${className}`}
    {...props}
  >
    {children}
  </div>
);
