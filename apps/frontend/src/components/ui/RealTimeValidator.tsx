import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Alert,
  Chip,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Fade,
  LinearProgress,
} from "@mui/material";
import {
  Check as ValidIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Lightbulb as SuggestionIcon,
  Close as CloseIcon,
  Navigation as NavigateIcon,
  Build as FixIcon,
} from "@mui/icons-material";

interface ValidationRule {
  id: string;
  type: "required" | "length" | "pattern" | "custom";
  message: string;
  severity: "error" | "warning" | "info";
  check: (value: string, context?: any) => boolean;
  suggestion?: string;
  relatedField?: string; // 関連フィールドへのナビゲーション
  fixAction?: () => void; // 自動修正アクション
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
  infos: ValidationRule[];
  suggestions: string[];
  score: number; // 0-100 validation score
}

interface RealTimeValidatorProps {
  value: string;
  label: string;
  placeholder?: string;
  rules: ValidationRule[];
  context?: any;
  onValueChange: (value: string) => void;
  onValidationChange?: (result: ValidationResult) => void;
  onNavigateToField?: (fieldName: string) => void; // 関連フィールドへのナビゲーション
  debounceMs?: number;
  showValidationScore?: boolean;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  suggestions?: string[];
  allowSuggestions?: boolean;
}

// 共通のバリデーションルール
export const createCommonRules = {
  required: (message = "この項目は必須です"): ValidationRule => ({
    id: "required",
    type: "required",
    message,
    severity: "error",
    check: (value) => value.trim().length > 0,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    id: "min-length",
    type: "length",
    message: message || `最低${min}文字必要です`,
    severity: "error",
    check: (value) => value.length >= min,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    id: "max-length",
    type: "length",
    message: message || `最大${max}文字まで入力可能です`,
    severity: "error",
    check: (value) => value.length <= max,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    id: "pattern",
    type: "pattern",
    message,
    severity: "error",
    check: (value) => regex.test(value),
  }),

  characterName: (): ValidationRule => ({
    id: "character-name",
    type: "pattern",
    message: "キャラクター名は文字、数字、スペースのみ使用可能です",
    severity: "warning",
    check: (value) => /^[a-zA-Z0-9\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*$/.test(value),
    suggestion: "特殊文字は避けて、読みやすい名前にしましょう",
    relatedField: "race", // 種族設定と関連
  }),

  diceNotation: (): ValidationRule => ({
    id: "dice-notation",
    type: "pattern",
    message: "ダイス記法が正しくありません（例: 2d6+3, 1d20）",
    severity: "error",
    check: (value) => /^\d+d\d+([+-]\d+)?$/.test(value),
    suggestion: "例: 2d6+3 (2個の6面ダイスに3を加算)",
  }),

  abilityScore: (): ValidationRule => ({
    id: "ability-score",
    type: "custom",
    message: "能力値は3-18の範囲で入力してください",
    severity: "error",
    check: (value) => {
      const num = parseInt(value);
      return !isNaN(num) && num >= 3 && num <= 18;
    },
  }),

  goldAmount: (): ValidationRule => ({
    id: "gold-amount",
    type: "custom",
    message: "金額は0以上の数値で入力してください",
    severity: "error",
    check: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;
    },
  }),

  questTitle: (): ValidationRule => ({
    id: "quest-title",
    type: "custom",
    message: "クエストタイトルは3文字以上50文字以下で入力してください",
    severity: "error",
    check: (value) => value.trim().length >= 3 && value.trim().length <= 50,
    suggestion: "魅力的で分かりやすいタイトルにしましょう",
  }),

  locationName: (): ValidationRule => ({
    id: "location-name",
    type: "custom",
    message: "場所名は2文字以上30文字以下で入力してください",
    severity: "error",
    check: (value) => value.trim().length >= 2 && value.trim().length <= 30,
  }),
};

const RealTimeValidator: React.FC<RealTimeValidatorProps> = ({
  value,
  label,
  placeholder,
  rules,
  context,
  onValueChange,
  onValidationChange,
  onNavigateToField,
  debounceMs = 300,
  showValidationScore = false,
  multiline = false,
  rows = 4,
  disabled = false,
  suggestions = [],
  allowSuggestions = true,
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    infos: [],
    suggestions: [],
    score: 100,
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // バリデーション実行
  const validateInput = (inputValue: string) => {
    setIsValidating(true);
    
    const errors: ValidationRule[] = [];
    const warnings: ValidationRule[] = [];
    const infos: ValidationRule[] = [];
    const resultSuggestions: string[] = [];

    rules.forEach(rule => {
      const isValid = rule.check(inputValue, context);
      if (!isValid) {
        switch (rule.severity) {
          case "error":
            errors.push(rule);
            break;
          case "warning":
            warnings.push(rule);
            break;
          case "info":
            infos.push(rule);
            break;
        }
        
        if (rule.suggestion) {
          resultSuggestions.push(rule.suggestion);
        }
      }
    });

    // スコア計算 (エラー: -30点, 警告: -10点, 情報: -5点)
    const totalPenalty = errors.length * 30 + warnings.length * 10 + infos.length * 5;
    const score = Math.max(0, 100 - totalPenalty);

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos,
      suggestions: resultSuggestions,
      score,
    };

    setValidationResult(result);
    setIsValidating(false);
    
    if (onValidationChange) {
      onValidationChange(result);
    }
  };

  // デバウンス付きバリデーション
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      validateInput(value);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, rules, context]);

  // 入力値変更ハンドラ
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
  };

  // 提案の適用
  const applySuggestion = (suggestion: string) => {
    handleValueChange(suggestion);
    setShowSuggestions(false);
  };

  // エラーの色とアイコン
  const getStatusColor = () => {
    if (validationResult.errors.length > 0) return "error";
    if (validationResult.warnings.length > 0) return "warning";
    if (validationResult.infos.length > 0) return "info";
    return "success";
  };

  const getStatusIcon = () => {
    if (validationResult.errors.length > 0) return <ErrorIcon />;
    if (validationResult.warnings.length > 0) return <WarningIcon />;
    if (validationResult.infos.length > 0) return <InfoIcon />;
    return <ValidIcon />;
  };

  return (
    <Box>
      {/* メインの入力フィールド */}
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleValueChange(e.target.value)}
        multiline={multiline}
        rows={multiline ? rows : 1}
        disabled={disabled}
        color={getStatusColor()}
        error={validationResult.errors.length > 0}
        helperText={
          validationResult.errors.length > 0
            ? validationResult.errors[0].message
            : validationResult.warnings.length > 0
            ? validationResult.warnings[0].message
            : ""
        }
        InputProps={{
          endAdornment: (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {isValidating && (
                <Box sx={{ width: 20 }}>
                  <LinearProgress sx={{ height: 20 }} />
                </Box>
              )}
              {!isValidating && (
                <Tooltip title={`検証スコア: ${validationResult.score}/100`}>
                  {getStatusIcon()}
                </Tooltip>
              )}
              {allowSuggestions && suggestions.length > 0 && (
                <Tooltip title="提案を表示">
                  <IconButton
                    size="small"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                  >
                    <SuggestionIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ),
        }}
      />

      {/* バリデーションスコア */}
      {showValidationScore && (
        <Box sx={{ mt: 1, mb: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              入力品質スコア
            </Typography>
            <Typography variant="caption" color={getStatusColor()}>
              {validationResult.score}/100
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={validationResult.score}
            color={getStatusColor()}
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>
      )}

      {/* バリデーション結果表示 */}
      {(validationResult.errors.length > 0 || 
        validationResult.warnings.length > 0 || 
        validationResult.infos.length > 0) && (
        <Box sx={{ mt: 1 }}>
          {validationResult.errors.map((error, index) => (
            <Alert 
              key={`error-${index}`} 
              severity="error" 
              sx={{ mb: 0.5 }}
              action={
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {error.fixAction && (
                    <Tooltip title="自動修正">
                      <IconButton size="small" onClick={error.fixAction}>
                        <FixIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {error.relatedField && onNavigateToField && (
                    <Tooltip title={`関連項目「${error.relatedField}」に移動`}>
                      <IconButton 
                        size="small" 
                        onClick={() => onNavigateToField(error.relatedField!)}
                      >
                        <NavigateIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
            >
              {error.message}
            </Alert>
          ))}
          {validationResult.warnings.map((warning, index) => (
            <Alert 
              key={`warning-${index}`} 
              severity="warning" 
              sx={{ mb: 0.5 }}
              action={
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {warning.fixAction && (
                    <Tooltip title="自動修正">
                      <IconButton size="small" onClick={warning.fixAction}>
                        <FixIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {warning.relatedField && onNavigateToField && (
                    <Tooltip title={`関連項目「${warning.relatedField}」に移動`}>
                      <IconButton 
                        size="small" 
                        onClick={() => onNavigateToField(warning.relatedField!)}
                      >
                        <NavigateIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
            >
              {warning.message}
            </Alert>
          ))}
          {validationResult.infos.map((info, index) => (
            <Alert 
              key={`info-${index}`} 
              severity="info" 
              sx={{ mb: 0.5 }}
              action={
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {info.fixAction && (
                    <Tooltip title="自動修正">
                      <IconButton size="small" onClick={info.fixAction}>
                        <FixIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {info.relatedField && onNavigateToField && (
                    <Tooltip title={`関連項目「${info.relatedField}」に移動`}>
                      <IconButton 
                        size="small" 
                        onClick={() => onNavigateToField(info.relatedField!)}
                      >
                        <NavigateIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
            >
              {info.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* 提案表示 */}
      <Fade in={showSuggestions && suggestions.length > 0}>
        <Paper sx={{ mt: 1, p: 1, border: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              <SuggestionIcon sx={{ fontSize: 16, mr: 0.5 }} />
              入力候補
            </Typography>
            <IconButton size="small" onClick={() => setShowSuggestions(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <List dense>
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <ListItem
                key={index}
                component="button"
                onClick={() => applySuggestion(suggestion)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <SuggestionIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={suggestion}
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Fade>

      {/* バリデーション提案 */}
      {validationResult.suggestions.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            改善提案:
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {validationResult.suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                size="small"
                icon={<InfoIcon />}
                variant="outlined"
                color="info"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RealTimeValidator;