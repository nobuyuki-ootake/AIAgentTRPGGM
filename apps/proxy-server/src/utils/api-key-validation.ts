interface ValidationRule {
  prefixes: string[];
  minLength: number;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

/**
 * APIキーの形式が有効かどうかをチェックする
 */
export function isValidApiKey(provider: string, apiKey: string): boolean {
  // プロバイダーごとの検証ルール
  const validationRules: ValidationRules = {
    openai: {
      prefixes: ['sk-'],
      minLength: 40,
    },
    claude: {
      prefixes: ['sk-ant-'],
      minLength: 30,
    },
    gemini: {
      prefixes: ['AI'], // Gemini AIのキーはAIで始まることが多い
      minLength: 20,
    },
  };

  // プロバイダーが未知の場合は無効
  if (!validationRules[provider]) {
    return false;
  }

  const rule = validationRules[provider];

  // 長さチェック
  if (apiKey.length < rule.minLength) {
    return false;
  }

  // プレフィックスチェック
  const result = rule.prefixes.some((prefix) => apiKey.startsWith(prefix));
  return result;
}

/**
 * APIキーを部分的に隠す (最初と最後の数文字のみ表示)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return '***';
  }

  const firstChars = apiKey.substring(0, 4);
  const lastChars = apiKey.substring(apiKey.length - 4);

  return `${firstChars}...${lastChars}`;
}
