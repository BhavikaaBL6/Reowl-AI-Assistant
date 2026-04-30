/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatISTDate = (date: Date = new Date()) => {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(date);
};

export const formatISTTime = (date: Date = new Date()) => {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).format(date);
};

export const formatISTShortDate = (date: Date = new Date()) => {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(date);
};

export const formatISTDateTime = (date: Date = new Date()) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  }).format(date);
};
