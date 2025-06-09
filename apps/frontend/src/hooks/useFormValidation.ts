// @ts-nocheck
import { useState, useEffect, useCallback } from "react";

interface ValidationRule {
  id: string;
  type: "required" | "length" | "pattern" | "custom";
  message: string;
  severity: "error" | "warning" | "info";
  check: (value: string, context?: any) => boolean;
  suggestion?: string;
}

interface FieldValidation {
  rules: ValidationRule[];
  context?: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  infos: string[];
  suggestions: string[];
  score: number;
}

interface FormValidationState {
  [fieldName: string]: ValidationResult;
}

interface UseFormValidationReturn {
  values: { [key: string]: string };
  validationState: FormValidationState;
  isFormValid: boolean;
  formScore: number;
  setValue: (fieldName: string, value: string) => void;
  setFieldRules: (fieldName: string, rules: ValidationRule[], context?: any) => void;
  validateField: (fieldName: string) => ValidationResult;
  validateForm: () => boolean;
  clearValidation: (fieldName?: string) => void;
  getFieldError: (fieldName: string) => string | null;
  getFieldWarning: (fieldName: string) => string | null;
  hasFieldError: (fieldName: string) => boolean;
  hasFieldWarning: (fieldName: string) => boolean;
}

// TRPGに特化したバリデーションルール集
export const TRPGValidationRules = {
  // キャラクター関連
  characterName: (): ValidationRule[] => [
    {
      id: "required",
      type: "required",
      message: "キャラクター名は必須です",
      severity: "error",
      check: (value) => value.trim().length > 0,
    },
    {
      id: "length",
      type: "length",
      message: "キャラクター名は2文字以上30文字以下で入力してください",
      severity: "error",
      check: (value) => value.trim().length >= 2 && value.trim().length <= 30,
    },
    {
      id: "pattern",
      type: "pattern",
      message: "特殊文字は使用できません",
      severity: "warning",
      check: (value) => /^[a-zA-Z0-9\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF-_]*$/.test(value),
      suggestion: "文字、数字、ひらがな、カタカナ、漢字のみ使用してください",
    },
  ],

  abilityScore: (min = 3, max = 18): ValidationRule[] => [
    {
      id: "required",
      type: "required",
      message: "能力値は必須です",
      severity: "error",
      check: (value) => value.trim().length > 0,
    },
    {
      id: "numeric",
      type: "pattern",
      message: "数値で入力してください",
      severity: "error",
      check: (value) => /^\d+$/.test(value),
    },
    {
      id: "range",
      type: "custom",
      message: `能力値は${min}～${max}の範囲で入力してください`,
      severity: "error",
      check: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= min && num <= max;
      },
    },
  ],

  diceNotation: (): ValidationRule[] => [
    {
      id: "required",
      type: "required",
      message: "ダイス記法は必須です",
      severity: "error",
      check: (value) => value.trim().length > 0,
    },
    {
      id: "pattern",
      type: "pattern",
      message: "正しいダイス記法で入力してください（例: 2d6+3）",
      severity: "error",
      check: (value) => /^\d+d\d+([+-]\d+)?$/.test(value.replace(/\s/g, "")),
      suggestion: "例: 1d20, 2d6+3, 3d8-1",
    },
  ],

  // クエスト関連
  questTitle: (): ValidationRule[] => [
    {
      id: "required",
      type: "required",
      message: "クエストタイトルは必須です",
      severity: "error",
      check: (value) => value.trim().length > 0,
    },
    {
      id: "length",
      type: "length",
      message: "クエストタイトルは3文字以上50文字以下で入力してください",
      severity: "error",
      check: (value) => value.trim().length >= 3 && value.trim().length <= 50,
    },
    {
      id: "uniqueness",
      type: "custom",
      message: "魅力的なタイトルを考えましょう",
      severity: "info",
      check: (value) => !["クエスト", "任務", "依頼"].includes(value.trim()),
      suggestion: "具体的で興味を引くタイトルにすると良いでしょう",
    },
  ],

  questDescription: (): ValidationRule[] => [
    {
      id: "required",
      type: "required",
      message: "クエストの説明は必須です",
      severity: "error",
      check: (value) => value.trim().length > 0,
    },
    {
      id: "length",
      type: "length",
      message: "説明は10文字以上500文字以下で入力してください",
      severity: "error",
      check: (value) => value.trim().length >= 10 && value.trim().length <= 500,
    },
    {
      id: "detail",
      type: "custom",
      message: "より詳細な説明があると良いでしょう",
      severity: "info",
      check: (value) => value.trim().length >= 50,
      suggestion: "目的、背景、期待される結果などを含めると良いでしょう",
    },
  ],

  // 場所関連
  locationName: (): ValidationRule[] => [
    {
      id: "required",
      type: "required",
      message: "場所名は必須です",
      severity: "error",
      check: (value) => value.trim().length > 0,
    },
    {
      id: "length",
      type: "length",
      message: "場所名は2文字以上30文字以下で入力してください",
      severity: "error",
      check: (value) => value.trim().length >= 2 && value.trim().length <= 30,
    },
  ],

  // 金額関連
  goldAmount: (): ValidationRule[] => [
    {
      id: "required",
      type: "required",
      message: "金額は必須です",
      severity: "error",
      check: (value) => value.trim().length > 0,
    },
    {
      id: "numeric",
      type: "pattern",
      message: "数値で入力してください",
      severity: "error",
      check: (value) => /^\d+(\.\d+)?$/.test(value),
    },
    {
      id: "positive",
      type: "custom",
      message: "0以上の値を入力してください",
      severity: "error",
      check: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
      },
    },
  ],

  // 経験値
  experiencePoints: (): ValidationRule[] => [
    {
      id: "numeric",
      type: "pattern",
      message: "数値で入力してください",
      severity: "error",
      check: (value) => value === "" || /^\d+$/.test(value),
    },
    {
      id: "positive",
      type: "custom",
      message: "0以上の値を入力してください",
      severity: "error",
      check: (value) => {
        if (value === "") return true;
        const num = parseInt(value);
        return !isNaN(num) && num >= 0;
      },
    },
  ],

  // レベル
  characterLevel: (min = 1, max = 20): ValidationRule[] => [
    {
      id: "required",
      type: "required",
      message: "レベルは必須です",
      severity: "error",
      check: (value) => value.trim().length > 0,
    },
    {
      id: "numeric",
      type: "pattern",
      message: "数値で入力してください",
      severity: "error",
      check: (value) => /^\d+$/.test(value),
    },
    {
      id: "range",
      type: "custom",
      message: `レベルは${min}～${max}の範囲で入力してください`,
      severity: "error",
      check: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= min && num <= max;
      },
    },
  ],
};

const useFormValidation = (debounceMs = 300): UseFormValidationReturn => {
  const [values, setValues] = useState<{ [key: string]: string }>({});
  const [fieldRules, setFieldRulesState] = useState<{ [key: string]: FieldValidation }>({});
  const [validationState, setValidationState] = useState<FormValidationState>({});

  // フィールド値の設定
  const setValue = useCallback((fieldName: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  // フィールドのバリデーションルール設定
  const setFieldRules = useCallback((fieldName: string, rules: ValidationRule[], context?: any) => {
    setFieldRulesState(prev => ({
      ...prev,
      [fieldName]: { rules, context }
    }));
  }, []);

  // 単一フィールドのバリデーション
  const validateField = useCallback((fieldName: string): ValidationResult => {
    const value = values[fieldName] || "";
    const fieldValidation = fieldRules[fieldName];
    
    if (!fieldValidation) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        infos: [],
        suggestions: [],
        score: 100,
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const infos: string[] = [];
    const suggestions: string[] = [];

    fieldValidation.rules.forEach(rule => {
      const isValid = rule.check(value, fieldValidation.context);
      
      if (!isValid) {
        const message = rule.message;
        
        switch (rule.severity) {
          case "error":
            errors.push(message);
            break;
          case "warning":
            warnings.push(message);
            break;
          case "info":
            infos.push(message);
            break;
        }
        
        if (rule.suggestion) {
          suggestions.push(rule.suggestion);
        }
      }
    });

    // スコア計算
    const totalPenalty = errors.length * 30 + warnings.length * 10 + infos.length * 5;
    const score = Math.max(0, 100 - totalPenalty);

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos,
      suggestions,
      score,
    };

    return result;
  }, [values, fieldRules]);

  // フォーム全体のバリデーション
  const validateForm = useCallback((): boolean => {
    const newValidationState: FormValidationState = {};
    let isFormValid = true;

    Object.keys(fieldRules).forEach(fieldName => {
      const result = validateField(fieldName);
      newValidationState[fieldName] = result;
      
      if (!result.isValid) {
        isFormValid = false;
      }
    });

    setValidationState(newValidationState);
    return isFormValid;
  }, [fieldRules, validateField]);

  // バリデーション状態のクリア
  const clearValidation = useCallback((fieldName?: string) => {
    if (fieldName) {
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[fieldName];
        return newState;
      });
    } else {
      setValidationState({});
    }
  }, []);

  // ヘルパー関数
  const getFieldError = useCallback((fieldName: string): string | null => {
    const validation = validationState[fieldName];
    return validation && validation.errors.length > 0 ? validation.errors[0] : null;
  }, [validationState]);

  const getFieldWarning = useCallback((fieldName: string): string | null => {
    const validation = validationState[fieldName];
    return validation && validation.warnings.length > 0 ? validation.warnings[0] : null;
  }, [validationState]);

  const hasFieldError = useCallback((fieldName: string): boolean => {
    const validation = validationState[fieldName];
    return validation ? validation.errors.length > 0 : false;
  }, [validationState]);

  const hasFieldWarning = useCallback((fieldName: string): boolean => {
    const validation = validationState[fieldName];
    return validation ? validation.warnings.length > 0 : false;
  }, [validationState]);

  // 値変更時の自動バリデーション
  useEffect(() => {
    const timer = setTimeout(() => {
      Object.keys(fieldRules).forEach(fieldName => {
        if (values[fieldName] !== undefined) {
          const result = validateField(fieldName);
          setValidationState(prev => ({
            ...prev,
            [fieldName]: result,
          }));
        }
      });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [values, fieldRules, validateField, debounceMs]);

  // フォーム全体の有効性と平均スコア
  const isFormValid = Object.values(validationState).every(validation => validation.isValid);
  const formScore = Object.values(validationState).length > 0
    ? Math.round(
        Object.values(validationState).reduce((sum, validation) => sum + validation.score, 0) /
        Object.values(validationState).length
      )
    : 100;

  return {
    values,
    validationState,
    isFormValid,
    formScore,
    setValue,
    setFieldRules,
    validateField,
    validateForm,
    clearValidation,
    getFieldError,
    getFieldWarning,
    hasFieldError,
    hasFieldWarning,
  };
};

export default useFormValidation;