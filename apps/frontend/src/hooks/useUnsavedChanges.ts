import { useState, useEffect, useCallback } from 'react';

export interface UnsavedChangesState {
  hasUnsavedChanges: boolean;
  setUnsavedChanges: (hasChanges: boolean) => void;
  markAsSaved: () => void;
  checkBeforeLeave: (callback: () => void) => boolean;
}

export const useUnsavedChanges = (): UnsavedChangesState => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const setUnsavedChanges = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const checkBeforeLeave = useCallback((callback: () => void): boolean => {
    if (hasUnsavedChanges) {
      // 未保存の変更がある場合はfalseを返して、呼び出し元で確認ダイアログを表示させる
      return false;
    }
    // 未保存の変更がない場合は、そのまま処理を続行
    callback();
    return true;
  }, [hasUnsavedChanges]);

  // ページの離脱時にブラウザの確認ダイアログを表示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return {
    hasUnsavedChanges,
    setUnsavedChanges,
    markAsSaved,
    checkBeforeLeave,
  };
};