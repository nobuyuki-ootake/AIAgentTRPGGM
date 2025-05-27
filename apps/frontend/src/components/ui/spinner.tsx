import React from "react";
import { cn } from "../../utils/cn";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * ローディングスピナーコンポーネント
 */
export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
      {...props}
    >
      <span className="sr-only">読み込み中...</span>
    </div>
  );
}
