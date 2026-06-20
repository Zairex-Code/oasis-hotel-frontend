/**
 * @file utils.ts
 * @description Core utility functions for dynamic styling and class management.
 * Integrates Tailwind CSS class merging strategies for reusable UI components.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to intelligently merge Tailwind CSS classes.
 * It resolves conflicts (e.g., passing 'bg-red-500' to a component that inherently has 'bg-blue-500')
 * by deferring to the latest passed utility class, ensuring component extensibility.
 * * @param inputs - Array of class names, objects, or conditional statements.
 * @returns A single, conflict-free string of Tailwind utility classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}