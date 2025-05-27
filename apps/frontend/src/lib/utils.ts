import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * tailwindcssのクラスをマージするユーティリティ関数
 * @param inputs 結合するクラス名
 * @returns マージされたクラス名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
