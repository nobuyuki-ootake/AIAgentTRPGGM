import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * クラス名を結合するためのユーティリティ関数
 * clsxとtailwind-mergeを組み合わせて使いやすくしたもの
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
