import React, { useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  children,
}) => {
  // onOpenChangeパラメータを使用する（ESCキー対応と一緒に）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;
  return <div>{children}</div>;
};

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({
  children,
  className = "",
  ...props
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // ESCキーでダイアログを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const closeBtn = document.querySelector("[data-dialog-close]");
        if (closeBtn) {
          (closeBtn as HTMLButtonElement).click();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === overlayRef.current) {
            const closeBtn = document.querySelector("[data-dialog-close]");
            if (closeBtn) {
              (closeBtn as HTMLButtonElement).click();
            }
          }
        }}
      />
      <div
        className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg sm:rounded-lg md:w-[90%] ${className}`}
        {...props}
      >
        {children}
      </div>
    </>
  );
};

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <h2
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
};

interface DialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <p className={`text-sm text-gray-500 ${className}`} {...props}>
      {children}
    </p>
  );
};
