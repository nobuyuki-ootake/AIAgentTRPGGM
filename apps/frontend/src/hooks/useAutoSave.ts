import { useState, useEffect, useRef, useCallback } from "react";

interface AutoSaveOptions {
  interval?: number; // Interval in milliseconds
  onSave: (data: any) => Promise<void> | void;
  onError?: (error: Error) => void;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  enabled?: boolean;
  debounceMs?: number; // Debounce time before saving
  maxRetries?: number;
  storageKey?: string; // For local storage backup
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  saveCount: number;
  errorCount: number;
  lastError: Error | null;
}

interface UseAutoSaveReturn {
  saveState: AutoSaveState;
  saveNow: () => Promise<void>;
  pauseSaving: () => void;
  resumeSaving: () => void;
  clearSaveState: () => void;
  forceLocalSave: () => void;
  hasUnsavedChanges: boolean;
}

const useAutoSave = <T>(
  data: T,
  options: AutoSaveOptions
): UseAutoSaveReturn => {
  const {
    interval = 3000, // 3 seconds default
    onSave,
    onError,
    onSaveStart,
    onSaveComplete,
    enabled = true,
    debounceMs = 1000,
    maxRetries = 3,
    storageKey,
  } = options;

  const [saveState, setSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    saveCount: 0,
    errorCount: 0,
    lastError: null,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<T>(data);
  const retryCountRef = useRef(0);
  const savePromiseRef = useRef<Promise<void> | null>(null);

  // データの変更を検出
  const hasDataChanged = useCallback((newData: T, oldData: T): boolean => {
    return JSON.stringify(newData) !== JSON.stringify(oldData);
  }, []);

  // ローカルストレージに保存
  const saveToLocalStorage = useCallback((dataToSave: T) => {
    if (storageKey) {
      try {
        const saveData = {
          data: dataToSave,
          timestamp: new Date().toISOString(),
          version: "1.0",
        };
        localStorage.setItem(storageKey, JSON.stringify(saveData));
      } catch (error) {
        console.warn("Failed to save to localStorage:", error);
      }
    }
  }, [storageKey]);

  // 強制ローカル保存
  const forceLocalSave = useCallback(() => {
    saveToLocalStorage(data);
  }, [data, saveToLocalStorage]);

  // 実際の保存処理
  const performSave = useCallback(async (dataToSave: T): Promise<void> => {
    if (!enabled || isPaused) return;

    setSaveState(prev => ({
      ...prev,
      isSaving: true,
      lastError: null,
    }));

    if (onSaveStart) {
      onSaveStart();
    }

    try {
      // まずローカルストレージに保存（バックアップとして）
      saveToLocalStorage(dataToSave);

      // メインの保存処理
      await onSave(dataToSave);

      // 成功時の状態更新
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        saveCount: prev.saveCount + 1,
        lastError: null,
      }));

      setHasUnsavedChanges(false);
      retryCountRef.current = 0;

      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      
      const saveError = error instanceof Error ? error : new Error("Save failed");
      
      // リトライ処理
      retryCountRef.current += 1;
      
      if (retryCountRef.current <= maxRetries) {
        // リトライを予約
        setTimeout(() => {
          performSave(dataToSave);
        }, Math.pow(2, retryCountRef.current) * 1000); // Exponential backoff
      } else {
        // 最大リトライ回数に達した場合
        setSaveState(prev => ({
          ...prev,
          isSaving: false,
          errorCount: prev.errorCount + 1,
          lastError: saveError,
        }));

        if (onError) {
          onError(saveError);
        }

        retryCountRef.current = 0;
      }
    }
  }, [enabled, isPaused, onSave, onSaveStart, onSaveComplete, onError, maxRetries, saveToLocalStorage]);

  // 即座に保存
  const saveNow = useCallback(async (): Promise<void> => {
    if (savePromiseRef.current) {
      // 既に進行中の保存がある場合は待機
      await savePromiseRef.current;
    }

    savePromiseRef.current = performSave(data);
    await savePromiseRef.current;
    savePromiseRef.current = null;
  }, [data, performSave]);

  // 自動保存の一時停止
  const pauseSaving = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // 自動保存の再開
  const resumeSaving = useCallback(() => {
    setIsPaused(false);
  }, []);

  // 保存状態のクリア
  const clearSaveState = useCallback(() => {
    setSaveState({
      isSaving: false,
      lastSaved: null,
      saveCount: 0,
      errorCount: 0,
      lastError: null,
    });
    setHasUnsavedChanges(false);
  }, []);

  // データ変更の監視
  useEffect(() => {
    if (hasDataChanged(data, lastDataRef.current)) {
      setHasUnsavedChanges(true);
      lastDataRef.current = data;

      // デバウンス処理
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (enabled && !isPaused) {
          performSave(data);
        }
      }, debounceMs);
    }
  }, [data, enabled, isPaused, debounceMs, performSave, hasDataChanged]);

  // 定期的な保存インターバル
  useEffect(() => {
    if (!enabled || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (hasUnsavedChanges && !saveState.isSaving) {
        performSave(data);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isPaused, hasUnsavedChanges, saveState.isSaving, data, interval, performSave]);

  // ページ離脱時の保存
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // 同期的に保存を試みる（制限があるが、可能な限り）
        try {
          saveToLocalStorage(data);
        } catch (error) {
          console.warn("Failed to save on page unload:", error);
        }

        // ユーザーに確認を求める
        const message = "保存されていない変更があります。ページを離れますか？";
        event.returnValue = message;
        return message;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        // ページが非表示になる時に保存
        saveToLocalStorage(data);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasUnsavedChanges, data, saveToLocalStorage]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    saveState,
    saveNow,
    pauseSaving,
    resumeSaving,
    clearSaveState,
    forceLocalSave,
    hasUnsavedChanges,
  };
};

export default useAutoSave;