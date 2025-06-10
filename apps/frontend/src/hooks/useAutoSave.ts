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
  enableOfflineMode?: boolean; // オフライン時の保存有効化
  maxVersions?: number; // 保持するバージョン数
  onOfflineModeChange?: (isOffline: boolean) => void; // オフライン状態変更通知
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  saveCount: number;
  errorCount: number;
  lastError: Error | null;
  isOnline: boolean; // オンライン状態
  isOfflineMode: boolean; // オフラインモード中
  pendingSyncCount: number; // 同期待ちのアイテム数
  currentVersion: number; // 現在のバージョン
}

interface UseAutoSaveReturn {
  saveState: AutoSaveState;
  saveNow: () => Promise<void>;
  pauseSaving: () => void;
  resumeSaving: () => void;
  clearSaveState: () => void;
  forceLocalSave: () => void;
  hasUnsavedChanges: boolean;
  getSavedVersions: () => Promise<SavedVersion[]>; // バージョン一覧取得
  restoreVersion: (version: number) => Promise<any>; // バージョン復元
  syncOfflineData: () => Promise<void>; // オフラインデータ同期
  getOfflinePendingCount: () => number; // オフライン保留数取得
}

interface SavedVersion {
  version: number;
  timestamp: string;
  size: number;
  isOffline: boolean;
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
    enableOfflineMode = true,
    maxVersions = 10,
    onOfflineModeChange,
  } = options;

  const [saveState, setSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    saveCount: 0,
    errorCount: 0,
    lastError: null,
    isOnline: navigator.onLine,
    isOfflineMode: false,
    pendingSyncCount: 0,
    currentVersion: Date.now(),
  });

  const [isPaused, setIsPaused] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<T>(data);
  const retryCountRef = useRef(0);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const offlinePendingRef = useRef<Array<{data: T, timestamp: string, version: number}>>([]);

  // データの変更を検出
  const hasDataChanged = useCallback((newData: T, oldData: T): boolean => {
    return JSON.stringify(newData) !== JSON.stringify(oldData);
  }, []);

  // バージョン管理付きローカルストレージ保存
  const saveToLocalStorage = useCallback((dataToSave: T, version?: number) => {
    if (storageKey) {
      try {
        const currentVersion = version || Date.now();
        const saveData = {
          data: dataToSave,
          timestamp: new Date().toISOString(),
          version: currentVersion,
          isOffline: !saveState.isOnline,
          size: JSON.stringify(dataToSave).length,
        };
        
        // メインデータを保存
        localStorage.setItem(storageKey, JSON.stringify(saveData));
        
        // バージョン履歴を管理
        const versionsKey = `${storageKey}_versions`;
        const existingVersions = JSON.parse(localStorage.getItem(versionsKey) || '[]');
        
        // 新しいバージョンを追加
        existingVersions.push({
          version: currentVersion,
          timestamp: saveData.timestamp,
          size: saveData.size,
          isOffline: saveData.isOffline,
        });
        
        // 古いバージョンを削除（maxVersionsを超える場合）
        if (existingVersions.length > maxVersions) {
          const versionsToRemove = existingVersions.splice(0, existingVersions.length - maxVersions);
          versionsToRemove.forEach((v: any) => {
            localStorage.removeItem(`${storageKey}_v${v.version}`);
          });
        }
        
        // バージョンデータを個別保存
        localStorage.setItem(`${storageKey}_v${currentVersion}`, JSON.stringify(saveData));
        localStorage.setItem(versionsKey, JSON.stringify(existingVersions));
        
        setSaveState(prev => ({ ...prev, currentVersion }));
      } catch (error) {
        console.warn("Failed to save to localStorage:", error);
      }
    }
  }, [storageKey, maxVersions, saveState.isOnline]);

  // 強制ローカル保存
  const forceLocalSave = useCallback(() => {
    saveToLocalStorage(data);
  }, [data, saveToLocalStorage]);

  // 実際の保存処理（オフライン対応）
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

      // オンラインの場合のみサーバー保存を試行
      if (saveState.isOnline) {
        await onSave(dataToSave);
        
        // 成功時の状態更新
        setSaveState(prev => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          saveCount: prev.saveCount + 1,
          lastError: null,
          isOfflineMode: false,
        }));
      } else {
        // オフライン時はペンディングリストに追加
        if (enableOfflineMode) {
          const pendingItem = {
            data: dataToSave,
            timestamp: new Date().toISOString(),
            version: Date.now(),
          };
          offlinePendingRef.current.push(pendingItem);
          
          setSaveState(prev => ({
            ...prev,
            isSaving: false,
            lastSaved: new Date(),
            saveCount: prev.saveCount + 1,
            lastError: null,
            isOfflineMode: true,
            pendingSyncCount: offlinePendingRef.current.length,
          }));
        }
      }

      setHasUnsavedChanges(false);
      retryCountRef.current = 0;

      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      
      const saveError = error instanceof Error ? error : new Error("Save failed");
      
      // オフライン保存にフォールバック
      if (enableOfflineMode && !saveState.isOfflineMode) {
        const pendingItem = {
          data: dataToSave,
          timestamp: new Date().toISOString(),
          version: Date.now(),
        };
        offlinePendingRef.current.push(pendingItem);
        
        setSaveState(prev => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          isOfflineMode: true,
          pendingSyncCount: offlinePendingRef.current.length,
          lastError: saveError,
        }));
        
        setHasUnsavedChanges(false);
        return;
      }
      
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
  }, [enabled, isPaused, onSave, onSaveStart, onSaveComplete, onError, maxRetries, saveToLocalStorage, saveState.isOnline, saveState.isOfflineMode, enableOfflineMode]);

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
      isOnline: navigator.onLine,
      isOfflineMode: false,
      pendingSyncCount: 0,
      currentVersion: 1,
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

  // オンライン/オフライン状態の監視
  useEffect(() => {
    const handleOnline = () => {
      setSaveState(prev => ({ ...prev, isOnline: true }));
      onOfflineModeChange?.(false);
      
      // オフラインデータの同期
      if (offlinePendingRef.current.length > 0) {
        syncOfflineData();
      }
    };

    const handleOffline = () => {
      setSaveState(prev => ({ ...prev, isOnline: false, isOfflineMode: enableOfflineMode }));
      onOfflineModeChange?.(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOfflineMode, onOfflineModeChange]);

  // バージョン一覧取得
  const getSavedVersions = useCallback(async (): Promise<SavedVersion[]> => {
    if (!storageKey) return [];
    
    try {
      const versionsKey = `${storageKey}_versions`;
      const versions = JSON.parse(localStorage.getItem(versionsKey) || '[]');
      return versions.sort((a: SavedVersion, b: SavedVersion) => b.version - a.version);
    } catch (error) {
      console.error('Failed to get saved versions:', error);
      return [];
    }
  }, [storageKey]);

  // バージョン復元
  const restoreVersion = useCallback(async (version: number): Promise<any> => {
    if (!storageKey) return null;
    
    try {
      const versionData = localStorage.getItem(`${storageKey}_v${version}`);
      if (versionData) {
        const parsed = JSON.parse(versionData);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to restore version:', error);
      return null;
    }
  }, [storageKey]);

  // オフラインデータ同期
  const syncOfflineData = useCallback(async (): Promise<void> => {
    if (!saveState.isOnline || offlinePendingRef.current.length === 0) return;

    const pendingItems = [...offlinePendingRef.current];
    offlinePendingRef.current = [];

    for (const item of pendingItems) {
      try {
        await onSave(item.data);
        setSaveState(prev => ({ 
          ...prev, 
          pendingSyncCount: Math.max(0, prev.pendingSyncCount - 1) 
        }));
      } catch (error) {
        console.error('Failed to sync offline data:', error);
        // 失敗したアイテムを再度ペンディングに戻す
        offlinePendingRef.current.push(item);
        setSaveState(prev => ({ 
          ...prev, 
          pendingSyncCount: offlinePendingRef.current.length 
        }));
        break;
      }
    }

    if (offlinePendingRef.current.length === 0) {
      setSaveState(prev => ({ ...prev, isOfflineMode: false }));
    }
  }, [saveState.isOnline, onSave]);

  // オフライン保留数取得
  const getOfflinePendingCount = useCallback((): number => {
    return offlinePendingRef.current.length;
  }, []);

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
    getSavedVersions,
    restoreVersion,
    syncOfflineData,
    getOfflinePendingCount,
  };
};

export default useAutoSave;