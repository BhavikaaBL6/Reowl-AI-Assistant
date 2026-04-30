/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge = ({ children, variant = 'primary', size = 'md', className = "" }: BadgeProps) => {
  const variants = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-neutral-100 text-neutral-600 border-neutral-200",
    danger: "bg-red-500/10 text-red-500 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[8px]",
    md: "px-3 py-1 text-xs"
  };

  return (
    <span className={`inline-flex items-center font-black uppercase tracking-widest rounded-md border ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
