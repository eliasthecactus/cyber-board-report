import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Uppercase text in JavaScript instead of with CSS `text-transform`. CSS turns
 * "ß" into "SS", which changes the text's length and garbles the letter
 * positions in the image PDF (html2canvas).
 */
export function capitals(text: string): string {
  return text.toUpperCase();
}
