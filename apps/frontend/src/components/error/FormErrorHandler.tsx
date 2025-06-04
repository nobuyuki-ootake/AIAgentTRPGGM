import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { Box, Typography, Alert, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Error as ErrorIcon, Warning as WarningIcon } from "@mui/material/icons";

// Form validation error types
export interface FormFieldError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
  value?: any;
}

export interface FormValidationState {
  isValid: boolean;
  errors: FormFieldError[];
  touched: Set<string>;
  submitted: boolean;
}

// Form validation actions
type FormValidationAction =
  | { type: 'SET_FIELD_ERROR'; payload: { field: string; error: FormFieldError } }
  | { type: 'CLEAR_FIELD_ERROR'; payload: { field: string } }
  | { type: 'SET_FIELD_TOUCHED'; payload: { field: string } }
  | { type: 'SET_SUBMITTED'; payload: { submitted: boolean } }
  | { type: 'RESET_VALIDATION' }
  | { type: 'SET_ERRORS'; payload: { errors: FormFieldError[] } };

// Form validation context
interface FormValidationContextValue {
  state: FormValidationState;
  setFieldError: (field: string, error: FormFieldError) => void;
  clearFieldError: (field: string) => void;
  setFieldTouched: (field: string) => void;
  setSubmitted: (submitted: boolean) => void;
  resetValidation: () => void;
  setErrors: (errors: FormFieldError[]) => void;
  getFieldError: (field: string) => FormFieldError | undefined;
  hasFieldError: (field: string) => boolean;
  getFieldErrorMessage: (field: string) => string | undefined;
  shouldShowFieldError: (field: string) => boolean;
}

const FormValidationContext = createContext<FormValidationContextValue | null>(null);

// Form validation reducer
function formValidationReducer(
  state: FormValidationState,
  action: FormValidationAction
): FormValidationState {
  switch (action.type) {
    case 'SET_FIELD_ERROR': {
      const { field, error } = action.payload;
      const newErrors = state.errors.filter(e => e.field !== field);
      newErrors.push(error);
      
      return {
        ...state,
        errors: newErrors,
        isValid: newErrors.length === 0,
      };
    }

    case 'CLEAR_FIELD_ERROR': {
      const newErrors = state.errors.filter(e => e.field !== action.payload.field);
      return {
        ...state,
        errors: newErrors,
        isValid: newErrors.length === 0,
      };
    }

    case 'SET_FIELD_TOUCHED': {
      const newTouched = new Set(state.touched);
      newTouched.add(action.payload.field);
      return {
        ...state,
        touched: newTouched,
      };
    }

    case 'SET_SUBMITTED': {
      return {
        ...state,
        submitted: action.payload.submitted,
      };
    }

    case 'RESET_VALIDATION': {
      return {
        isValid: true,
        errors: [],
        touched: new Set(),
        submitted: false,
      };
    }

    case 'SET_ERRORS': {
      return {
        ...state,
        errors: action.payload.errors,
        isValid: action.payload.errors.length === 0,
      };
    }

    default:
      return state;
  }
}

// Form validation provider
export const FormValidationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(formValidationReducer, {
    isValid: true,
    errors: [],
    touched: new Set(),
    submitted: false,
  });

  const setFieldError = (field: string, error: FormFieldError) => {
    dispatch({ type: 'SET_FIELD_ERROR', payload: { field, error } });
  };

  const clearFieldError = (field: string) => {
    dispatch({ type: 'CLEAR_FIELD_ERROR', payload: { field } });
  };

  const setFieldTouched = (field: string) => {
    dispatch({ type: 'SET_FIELD_TOUCHED', payload: { field } });
  };

  const setSubmitted = (submitted: boolean) => {
    dispatch({ type: 'SET_SUBMITTED', payload: { submitted } });
  };

  const resetValidation = () => {
    dispatch({ type: 'RESET_VALIDATION' });
  };

  const setErrors = (errors: FormFieldError[]) => {
    dispatch({ type: 'SET_ERRORS', payload: { errors } });
  };

  const getFieldError = (field: string): FormFieldError | undefined => {
    return state.errors.find(e => e.field === field);
  };

  const hasFieldError = (field: string): boolean => {
    return state.errors.some(e => e.field === field);
  };

  const getFieldErrorMessage = (field: string): string | undefined => {
    const error = getFieldError(field);
    return error?.message;
  };

  const shouldShowFieldError = (field: string): boolean => {
    return (state.touched.has(field) || state.submitted) && hasFieldError(field);
  };

  const contextValue: FormValidationContextValue = {
    state,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    setSubmitted,
    resetValidation,
    setErrors,
    getFieldError,
    hasFieldError,
    getFieldErrorMessage,
    shouldShowFieldError,
  };

  return (
    <FormValidationContext.Provider value={contextValue}>
      {children}
    </FormValidationContext.Provider>
  );
};

// Hook to use form validation
export const useFormValidation = (): FormValidationContextValue => {
  const context = useContext(FormValidationContext);
  if (!context) {
    throw new Error('useFormValidation must be used within a FormValidationProvider');
  }
  return context;
};

// TRPG-specific validation rules
export class TRPGFormValidator {
  static validateCampaignName(name: string): FormFieldError | null {
    if (!name || name.trim().length === 0) {
      return {
        field: 'campaignName',
        message: 'キャンペーン名は必須です',
        code: 'REQUIRED',
        severity: 'error',
        value: name,
      };
    }
    
    if (name.trim().length > 100) {
      return {
        field: 'campaignName',
        message: 'キャンペーン名は100文字以内で入力してください',
        code: 'MAX_LENGTH',
        severity: 'error',
        value: name,
      };
    }

    if (name.trim().length < 2) {
      return {
        field: 'campaignName',
        message: 'キャンペーン名は2文字以上で入力してください',
        code: 'MIN_LENGTH',
        severity: 'error',
        value: name,
      };
    }

    return null;
  }

  static validateCharacterName(name: string): FormFieldError | null {
    if (!name || name.trim().length === 0) {
      return {
        field: 'characterName',
        message: 'キャラクター名は必須です',
        code: 'REQUIRED',
        severity: 'error',
        value: name,
      };
    }

    if (name.trim().length > 50) {
      return {
        field: 'characterName',
        message: 'キャラクター名は50文字以内で入力してください',
        code: 'MAX_LENGTH',
        severity: 'error',
        value: name,
      };
    }

    return null;
  }

  static validateAbilityScore(score: number, abilityName: string): FormFieldError | null {
    if (isNaN(score) || score < 1) {
      return {
        field: `ability_${abilityName}`,
        message: `${abilityName}は1以上の数値で入力してください`,
        code: 'MIN_VALUE',
        severity: 'error',
        value: score,
      };
    }

    if (score > 20) {
      return {
        field: `ability_${abilityName}`,
        message: `${abilityName}は20以下の数値で入力してください`,
        code: 'MAX_VALUE',
        severity: 'error',
        value: score,
      };
    }

    return null;
  }

  static validateAbilityTotal(scores: Record<string, number>): FormFieldError | null {
    const total = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    const average = total / Object.keys(scores).length;

    if (total > 108) { // 6 abilities × 18 max
      return {
        field: 'abilityTotal',
        message: '能力値の合計が高すぎます（最大108）',
        code: 'ABILITY_TOTAL_TOO_HIGH',
        severity: 'error',
        value: total,
      };
    }

    if (average < 8) {
      return {
        field: 'abilityTotal',
        message: '能力値の平均が低すぎます（最低8）',
        code: 'ABILITY_AVERAGE_TOO_LOW',
        severity: 'warning',
        value: average,
      };
    }

    return null;
  }

  static validateDiceExpression(expression: string): FormFieldError | null {
    if (!expression || expression.trim().length === 0) {
      return {
        field: 'diceExpression',
        message: 'ダイス記法を入力してください',
        code: 'REQUIRED',
        severity: 'error',
        value: expression,
      };
    }

    // Basic dice notation validation
    const dicePattern = /^(\d+d\d+([+-]\d+)?(\s*[+-]\s*\d+d\d+([+-]\d+)?)*|[+-]?\d+)$/i;
    if (!dicePattern.test(expression.replace(/\s/g, ''))) {
      return {
        field: 'diceExpression',
        message: '正しいダイス記法で入力してください（例: 3d6+2, 1d20）',
        code: 'INVALID_FORMAT',
        severity: 'error',
        value: expression,
      };
    }

    // Check for excessive dice counts
    const diceMatches = expression.match(/(\d+)d\d+/gi);
    if (diceMatches) {
      const totalDice = diceMatches.reduce((sum, match) => {
        const count = parseInt(match.split('d')[0]);
        return sum + count;
      }, 0);

      if (totalDice > 100) {
        return {
          field: 'diceExpression',
          message: 'ダイスの数が多すぎます（最大100個）',
          code: 'TOO_MANY_DICE',
          severity: 'error',
          value: totalDice,
        };
      }
    }

    return null;
  }

  static validateEventDate(date: string): FormFieldError | null {
    if (!date) {
      return {
        field: 'eventDate',
        message: 'イベント日時は必須です',
        code: 'REQUIRED',
        severity: 'error',
        value: date,
      };
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return {
        field: 'eventDate',
        message: '有効な日時を入力してください',
        code: 'INVALID_DATE',
        severity: 'error',
        value: date,
      };
    }

    const now = new Date();
    if (parsedDate < now) {
      return {
        field: 'eventDate',
        message: '過去の日時は設定できません',
        code: 'DATE_IN_PAST',
        severity: 'warning',
        value: date,
      };
    }

    return null;
  }

  static validateLocationName(name: string): FormFieldError | null {
    if (!name || name.trim().length === 0) {
      return {
        field: 'locationName',
        message: '場所名は必須です',
        code: 'REQUIRED',
        severity: 'error',
        value: name,
      };
    }

    if (name.trim().length > 100) {
      return {
        field: 'locationName',
        message: '場所名は100文字以内で入力してください',
        code: 'MAX_LENGTH',
        severity: 'error',
        value: name,
      };
    }

    return null;
  }
}

// Form error summary component
export const FormErrorSummary: React.FC<{
  title?: string;
  maxErrors?: number;
}> = ({ title = "入力エラー", maxErrors = 10 }) => {
  const { state } = useFormValidation();
  
  if (state.errors.length === 0) return null;

  const displayErrors = state.errors.slice(0, maxErrors);
  const hasMoreErrors = state.errors.length > maxErrors;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="error">
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <List dense>
          {displayErrors.map((error, index) => (
            <ListItem key={`${error.field}-${index}`} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {error.severity === 'error' ? (
                  <ErrorIcon color="error" fontSize="small" />
                ) : (
                  <WarningIcon color="warning" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={error.message}
                secondary={error.field !== 'general' ? `フィールド: ${error.field}` : undefined}
              />
            </ListItem>
          ))}
        </List>
        {hasMoreErrors && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            他に{state.errors.length - maxErrors}件のエラーがあります
          </Typography>
        )}
      </Alert>
    </Box>
  );
};

export default FormValidationProvider;