/**
 * AIプロンプトテンプレート管理モジュール
 * このファイルはAIとの通信で使用するテンプレートを一元管理します
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {
  StandardAIRequest,
  StandardAIResponse,
} from '@novel-ai-assistant/types';
import { buildStandardSystemPrompt } from './aiRequestStandard.js';

// テンプレートタイプの定義
export enum TemplateType {
  SYSTEM_PROMPT = 'system_prompt',
  USER_PROMPT = 'user_prompt',
  JSON_FORMAT = 'json_format',
  YAML_FORMAT = 'yaml_format',
  STRUCTURED_FORMAT = 'structured_format',
}

// データフォーマット型
export type DataFormat = 'json' | 'yaml';

// テンプレート管理クラス
class TemplateManager {
  private templates: Map<string, string>;
  private modelSpecificTemplates: Map<string, Map<string, string>>;

  constructor() {
    this.templates = new Map();
    this.modelSpecificTemplates = new Map();
    this.initializeTemplates();
  }

  // テンプレートの初期化
  private initializeTemplates(): void {
    // JSON基本テンプレート
    this.templates.set('json:places', this.getJsonPlacesTemplate());
    this.templates.set('json:cultures', this.getJsonCulturesTemplate());
    this.templates.set('json:characters', this.getJsonCharactersTemplate());
    // 汎用的な世界観要素リストテンプレート（新規追加）
    this.templates.set(
      'json:world-building-list-generic',
      this.getGenericWorldBuildingListJsonTemplate(),
    );

    // YAML基本テンプレート（新規追加）
    this.templates.set('yaml:places', this.getYamlPlacesTemplate());
    this.templates.set('yaml:cultures', this.getYamlCulturesTemplate());
    this.templates.set('yaml:characters', this.getYamlCharactersTemplate());
    // 汎用的な世界観要素リストテンプレート（YAML版）（新規追加）
    this.templates.set(
      'yaml:world-building-list-generic',
      this.getGenericWorldBuildingListYamlTemplate(),
    );

    // モデル固有のテンプレート
    const geminiTemplates = new Map<string, string>();
    // Gemini用のJSONテンプレート
    geminiTemplates.set('json:places', this.getGeminiJsonPlacesTemplate());
    geminiTemplates.set('json:cultures', this.getGeminiJsonCulturesTemplate());
    geminiTemplates.set(
      'json:characters',
      this.getGeminiJsonCharactersTemplate(),
    );
    // Gemini用の汎用世界観要素リストテンプレート（新規追加）
    geminiTemplates.set(
      'json:world-building-list-generic',
      this.getGeminiGenericWorldBuildingListJsonTemplate(),
    );
    // Gemini用のYAMLテンプレート（新規追加）
    geminiTemplates.set('yaml:places', this.getGeminiYamlPlacesTemplate());
    geminiTemplates.set('yaml:cultures', this.getGeminiYamlCulturesTemplate());
    geminiTemplates.set(
      'yaml:characters',
      this.getGeminiYamlCharactersTemplate(),
    );
    // Gemini用の汎用世界観要素リストテンプレート（YAML版）（新規追加）
    geminiTemplates.set(
      'yaml:world-building-list-generic',
      this.getGeminiGenericWorldBuildingListYamlTemplate(),
    );

    this.modelSpecificTemplates.set('gemini', geminiTemplates);
  }

  // テンプレート取得（モデル指定可能）
  getTemplate(key: string, model?: string): string {
    // モデル固有のテンプレートがある場合はそれを返す
    if (model && this.modelSpecificTemplates.has(model)) {
      const modelTemplates = this.modelSpecificTemplates.get(model);
      if (modelTemplates && modelTemplates.has(key)) {
        return modelTemplates.get(key) || '';
      }
    }

    // 標準テンプレートを返す
    return this.templates.get(key) || '';
  }

  // 指定された形式とタイプに基づいてテンプレートを取得
  getFormatTemplate(format: DataFormat, type: string, model?: string): string {
    const key = `${format}:${type}`;
    return this.getTemplate(key, model);
  }

  // 動的テンプレート生成
  getDynamicTemplate(
    type: TemplateType,
    context: Record<string, any> = {},
  ): string {
    switch (type) {
      case TemplateType.SYSTEM_PROMPT:
        return buildStandardSystemPrompt(
          context.requestType || 'worldbuilding',
          {
            elementName: context.elementName,
            elementType: context.elementType,
            characterName: context.characterName,
            characterRole: context.characterRole,
          },
        );

      // 他の動的テンプレート生成ケース
      default:
        return '';
    }
  }

  // 世界観要素のシステムプロンプト構築
  buildWorldElementSystemPrompt(
    elementName: string,
    elementType: string,
  ): string {
    return buildStandardSystemPrompt('worldbuilding', {
      elementName,
      elementType,
    });
  }

  // 世界観要素のユーザープロンプト構築（YAML形式対応）
  buildWorldElementUserPrompt(
    elementName: string,
    elementType: string,
    userMessage: string,
    format: DataFormat = 'yaml',
  ): string {
    return `
以下の厳密な${format === 'yaml' ? 'YAML' : 'JSON'}フォーマットに従って、「${elementName}」という${elementType}の詳細情報を作成してください。

重要な注意:
- 特殊なマーカー記号（**、##、-- など）は名前や説明に付けないでください
- 純粋なテキストのみを使用してください
- 装飾や強調のための記号は使わないでください
- ${format === 'yaml' ? 'YAMLの正確なインデント（2スペース）を使用し、以下のフォーマットに合わせてください' : 'JSONの正確な形式（括弧、カンマ、引用符）に従ってください'}

以下の${format === 'yaml' ? 'YAML' : 'JSON'}フォーマットで回答してください:

${
  format === 'yaml'
    ? `---
name: ${elementName}
type: ${elementType}
description: (詳細な説明を書いてください)
features: (主要な特徴を書いてください)
importance: (物語における重要性を書いてください)
${elementType === '場所' ? 'location: (地理的な立地や環境を書いてください)\npopulation: (おおよその人口規模を書いてください)\nculturalTraits: (この場所特有の文化を書いてください)' : ''}
${elementType === '文化' ? 'customs: (文化における重要な習慣を書いてください)\nbeliefs: (文化的な信念や価値観を書いてください)\nhistory: (文化の簡単な歴史を書いてください)' : ''}
${elementType === 'ルール' ? 'impact: (ルールが世界に与える影響を書いてください)\nexceptions: (ルールの例外や制限を書いてください)\norigin: (ルールの起源や理由を書いてください)' : ''}
relations:
  - name: (関連する要素1)
    description: (関係の説明)
  - name: (関連する要素2)
    description: (関係の説明)
...`
    : `{
  "name": "${elementName}",
  "type": "${elementType}",
  "description": "(詳細な説明を書いてください)",
  ${elementType === '場所' ? '"location": "(地理的な立地や環境を書いてください)",\n  "population": "(おおよその人口規模を書いてください)",\n  "culturalTraits": "(この場所特有の文化を書いてください)",' : ''}
  ${elementType === '文化' ? '"customs": "(文化における重要な習慣を書いてください)",\n  "beliefs": "(文化的な信念や価値観を書いてください)",\n  "history": "(文化の簡単な歴史を書いてください)",' : ''}
  ${elementType === 'ルール' ? '"impact": "(ルールが世界に与える影響を書いてください)",\n  "exceptions": "(ルールの例外や制限を書いてください)",\n  "origin": "(ルールの起源や理由を書いてください)",' : ''}
  "relations": [
    {
      "name": "(関連する要素1)",
      "description": "(関係の説明)"
    },
    {
      "name": "(関連する要素2)",
      "description": "(関係の説明)"
    }
  ]
}`
}

${userMessage}
`;
  }

  // キャラクターのシステムプロンプト構築
  buildCharacterSystemPrompt(
    characterName: string,
    characterRole: string,
  ): string {
    return buildStandardSystemPrompt('character', {
      characterName,
      characterRole,
    });
  }

  // キャラクターのユーザープロンプト構築（YAML形式対応）
  buildCharacterUserPrompt(
    characterName: string,
    characterRole: string,
    userMessage: string,
    format: DataFormat = 'yaml',
  ): string {
    return `
「${characterName}」というキャラクターの詳細情報を以下の${format === 'yaml' ? 'YAML' : 'JSON'}形式で作成してください。
役割は「${characterRole}」です。

${
  format === 'yaml'
    ? `---
name: ${characterName}
role: ${characterRole}
gender: (性別を入力)
age: (年齢を入力)
description: (短い説明)
background: (背景情報)
motivation: (動機)
traits:
  - (特性1)
  - (特性2)
  - (特性3)
icon: (絵文字)
relationships:
  - name: (他キャラ名)
    type: (関係タイプ)
    description: (関係の説明)
  - name: (他キャラ名)
    type: (関係タイプ)
    description: (関係の説明)
...`
    : `{
  "name": "${characterName}",
  "role": "${characterRole}",
  "gender": "(性別を入力)",
  "age": "(年齢を入力)",
  "description": "(短い説明)",
  "background": "(背景情報)",
  "motivation": "(動機)",
  "traits": [
    "(特性1)",
    "(特性2)",
    "(特性3)"
  ],
  "icon": "(絵文字)",
  "relationships": [
    {
      "name": "(他キャラ名)",
      "type": "(関係タイプ)",
      "description": "(関係の説明)"
    },
    {
      "name": "(他キャラ名)",
      "type": "(関係タイプ)",
      "description": "(関係の説明)"
    }
  ]
}`
}

${userMessage}
`;
  }

  // 標準のJSON場所テンプレート
  private getJsonPlacesTemplate(): string {
    return `
以下の厳密なJSONフォーマットで出力してください:

[
  {"name": "場所の名前1", "description": "詳細な説明", "importance": "重要度・物語での役割"},
  {"name": "場所の名前2", "description": "詳細な説明", "importance": "重要度・物語での役割"},
  {"name": "場所の名前3", "description": "詳細な説明", "importance": "重要度・物語での役割"}
]

重要な注意:
- 上記の厳密なJSONフォーマットのみを返してください
- コードブロック(\`\`\`json)やその他のマークダウン記法は使わないでください
- 特殊なマーカー記号(**、##、--など)は使わないでください
- 説明文や前置き、後置きは一切不要です
- 純粋なJSON配列のみを返してください
- すべてのテキストは通常の平文で記述し、特殊書式は使用しないでください
`;
  }

  // YAML場所テンプレート（新規追加）
  private getYamlPlacesTemplate(): string {
    return `
以下の厳密なYAMLフォーマットで出力してください:

---
- name: 場所の名前1
  description: 詳細な説明
  importance: 重要度・物語での役割
- name: 場所の名前2
  description: 詳細な説明
  importance: 重要度・物語での役割
- name: 場所の名前3
  description: 詳細な説明
  importance: 重要度・物語での役割
...

重要な注意:
- 上記の厳密なYAMLフォーマットのみを返してください
- コードブロック(\`\`\`yaml)やその他のマークダウン記法は使わないでください
- 特殊なマーカー記号(**、##、--など)は使わないでください
- 説明文や前置き、後置きは一切不要です
- 正確なインデント（各レベルで2スペース）を使用してください
- すべてのテキストは通常の平文で記述し、特殊書式は使用しないでください
`;
  }

  // Gemini向けのJSON場所テンプレート（より厳格な指示）
  private getGeminiJsonPlacesTemplate(): string {
    return `
以下の内容を正確なJSONフォーマットで出力してください。最終的な出力は有効なJSON配列のみにしてください。

[
  {"name": "場所の名前1", "description": "詳細な説明", "importance": "重要度・物語での役割"},
  {"name": "場所の名前2", "description": "詳細な説明", "importance": "重要度・物語での役割"},
  {"name": "場所の名前3", "description": "詳細な説明", "importance": "重要度・物語での役割"}
]

制約条件:
1. マークダウン記法、コードブロック、特殊記号は一切使用しない
2. 出力は上記のJSON配列形式のみ
3. 余分な説明や前置き・後置きは含めない
4. 各エントリは必ず"name"、"description"、"importance"フィールドを含むこと
5. すべての文字列値は二重引用符("")で囲むこと
6. 配列の先頭と末尾には角括弧([])を使用すること
7. 各オブジェクトはカンマで区切ること
8. 最後のオブジェクトの後にはカンマを付けないこと

完全なJSON配列のみを出力し、これ以外の文字を含めないでください。
`;
  }

  // Gemini向けのYAML場所テンプレート（新規追加）
  private getGeminiYamlPlacesTemplate(): string {
    return `
以下の内容を正確なYAMLフォーマットで出力してください。最終的な出力はYAMLドキュメントのみにしてください。

---
- name: 場所の名前1
  description: 詳細な説明
  importance: 重要度・物語での役割
- name: 場所の名前2
  description: 詳細な説明
  importance: 重要度・物語での役割
- name: 場所の名前3
  description: 詳細な説明
  importance: 重要度・物語での役割
...

制約条件:
1. マークダウン記法、コードブロック、特殊記号は一切使用しない
2. 出力は上記のYAMLドキュメントのみ
3. 余分な説明や前置き・後置きは含めない
4. 各エントリは必ず"name"、"description"、"importance"フィールドを含むこと
5. 正確なインデント（各レベルで2スペース）を使用すること
6. 文書の開始と終了には"---"と"..."を使用すること
7. 各エントリは"-"で始めること

完全なYAMLドキュメントのみを出力し、これ以外の文字を含めないでください。
`;
  }

  // 文化向けのJSON形式テンプレート
  private getJsonCulturesTemplate(): string {
    return `
以下の厳密なJSONフォーマットで出力してください:

[
  {"name": "文化の名前1", "description": "詳細な説明", "importance": "重要度・物語での役割"},
  {"name": "文化の名前2", "description": "詳細な説明", "importance": "重要度・物語での役割"},
  {"name": "文化の名前3", "description": "詳細な説明", "importance": "重要度・物語での役割"}
]

重要な注意:
- 上記の厳密なJSONフォーマットのみを返してください
- コードブロック(\`\`\`json)やその他のマークダウン記法は使わないでください
- 特殊なマーカー記号(**、##、--など)は使わないでください
- 説明文や前置き、後置きは一切不要です
- 純粋なJSON配列のみを返してください
- すべてのテキストは通常の平文で記述し、特殊書式は使用しないでください
`;
  }

  // 文化向けのYAML形式テンプレート（新規追加）
  private getYamlCulturesTemplate(): string {
    return `
以下の厳密なYAMLフォーマットで出力してください:

---
- name: 文化の名前1
  description: 詳細な説明
  importance: 重要度・物語での役割
- name: 文化の名前2
  description: 詳細な説明
  importance: 重要度・物語での役割
- name: 文化の名前3
  description: 詳細な説明
  importance: 重要度・物語での役割
...

重要な注意:
- 上記の厳密なYAMLフォーマットのみを返してください
- コードブロック(\`\`\`yaml)やその他のマークダウン記法は使わないでください
- 特殊なマーカー記号(**、##、--など)は使わないでください
- 説明文や前置き、後置きは一切不要です
- 正確なインデント（各レベルで2スペース）を使用してください
- すべてのテキストは通常の平文で記述し、特殊書式は使用しないでください
`;
  }

  // Gemini向け文化のJSON形式テンプレート
  private getGeminiJsonCulturesTemplate(): string {
    return `
以下の内容を正確なJSONフォーマットで出力してください。最終的な出力は有効なJSON配列のみにしてください。

[
  {"name": "文化の名前1", "description": "詳細な説明", "importance": "重要度・物語での役割"},
  {"name": "文化の名前2", "description": "詳細な説明", "importance": "重要度・物語での役割"},
  {"name": "文化の名前3", "description": "詳細な説明", "importance": "重要度・物語での役割"}
]

制約条件:
1. マークダウン記法、コードブロック、特殊記号は一切使用しない
2. 出力は上記のJSON配列形式のみ
3. 余分な説明や前置き・後置きは含めない
4. 各エントリは必ず"name"、"description"、"importance"フィールドを含むこと
5. すべての文字列値は二重引用符("")で囲むこと
6. 配列の先頭と末尾には角括弧([])を使用すること
7. 各オブジェクトはカンマで区切ること
8. 最後のオブジェクトの後にはカンマを付けないこと

完全なJSON配列のみを出力し、これ以外の文字を含めないでください。
`;
  }

  // Gemini向け文化のYAML形式テンプレート（新規追加）
  private getGeminiYamlCulturesTemplate(): string {
    return `
以下の内容を正確なYAMLフォーマットで出力してください。最終的な出力はYAMLドキュメントのみにしてください。

---
- name: 文化の名前1
  description: 詳細な説明
  importance: 重要度・物語での役割
- name: 文化の名前2
  description: 詳細な説明
  importance: 重要度・物語での役割
- name: 文化の名前3
  description: 詳細な説明
  importance: 重要度・物語での役割
...

制約条件:
1. マークダウン記法、コードブロック、特殊記号は一切使用しない
2. 出力は上記のYAMLドキュメントのみ
3. 余分な説明や前置き・後置きは含めない
4. 各エントリは必ず"name"、"description"、"importance"フィールドを含むこと
5. 正確なインデント（各レベルで2スペース）を使用すること
6. 文書の開始と終了には"---"と"..."を使用すること
7. 各エントリは"-"で始めること

完全なYAMLドキュメントのみを出力し、これ以外の文字を含めないでください。
`;
  }

  // キャラクター向けのJSON形式テンプレート
  private getJsonCharactersTemplate(): string {
    return `
以下の厳密なJSONフォーマットで出力してください:

[
  {"name": "キャラクター名1", "role": "主人公/敵役/脇役", "brief": "簡単な説明"},
  {"name": "キャラクター名2", "role": "主人公/敵役/脇役", "brief": "簡単な説明"},
  {"name": "キャラクター名3", "role": "主人公/敵役/脇役", "brief": "簡単な説明"}
]

重要な注意:
- 上記の厳密なJSONフォーマットのみを返してください
- コードブロック(\`\`\`json)やその他のマークダウン記法は使わないでください
- 特殊なマーカー記号は使わないでください
- 説明文や前置き、後置きは一切不要です
- 純粋なJSON配列のみを返してください
`;
  }

  // キャラクター向けのYAML形式テンプレート（新規追加）
  private getYamlCharactersTemplate(): string {
    return `
以下の厳密なYAMLフォーマットで出力してください:

---
- name: キャラクター名1
  role: 主人公/敵役/脇役
  brief: 簡単な説明
- name: キャラクター名2
  role: 主人公/敵役/脇役
  brief: 簡単な説明
- name: キャラクター名3
  role: 主人公/敵役/脇役
  brief: 簡単な説明
...

重要な注意:
- 上記の厳密なYAMLフォーマットのみを返してください
- コードブロック(\`\`\`yaml)やその他のマークダウン記法は使わないでください
- 特殊なマーカー記号は使わないでください
- 説明文や前置き、後置きは一切不要です
- 正確なインデント（各レベルで2スペース）を使用してください
`;
  }

  // Gemini向けキャラクターのJSON形式テンプレート
  private getGeminiJsonCharactersTemplate(): string {
    return `
以下の内容を正確なJSONフォーマットで出力してください。最終的な出力は有効なJSON配列のみにしてください。

[
  {"name": "キャラクター名1", "role": "主人公/敵役/脇役", "brief": "簡単な説明"},
  {"name": "キャラクター名2", "role": "主人公/敵役/脇役", "brief": "簡単な説明"},
  {"name": "キャラクター名3", "role": "主人公/敵役/脇役", "brief": "簡単な説明"}
]

制約条件:
1. マークダウン記法、コードブロック、特殊記号は一切使用しない
2. 出力は上記のJSON配列形式のみ
3. 余分な説明や前置き・後置きは含めない
4. 各エントリは必ず"name"、"role"、"brief"フィールドを含むこと
5. すべての文字列値は二重引用符("")で囲むこと
6. 配列の先頭と末尾には角括弧([])を使用すること
7. 各オブジェクトはカンマで区切ること
8. 最後のオブジェクトの後にはカンマを付けないこと

完全なJSON配列のみを出力し、これ以外の文字を含めないでください。
`;
  }

  // Gemini向けキャラクターのYAML形式テンプレート（新規追加）
  private getGeminiYamlCharactersTemplate(): string {
    return `
以下の内容を正確なYAMLフォーマットで出力してください。最終的な出力はYAMLドキュメントのみにしてください。

---
- name: キャラクター名1
  role: 主人公/敵役/脇役
  brief: 簡単な説明
- name: キャラクター名2
  role: 主人公/敵役/脇役
  brief: 簡単な説明
- name: キャラクター名3
  role: 主人公/敵役/脇役
  brief: 簡単な説明
...

制約条件:
1. マークダウン記法、コードブロック、特殊記号は一切使用しない
2. 出力は上記のYAMLドキュメントのみ
3. 余分な説明や前置き・後置きは含めない
4. 各エントリは必ず"name"、"role"、"brief"フィールドを含むこと
5. 正確なインデント（各レベルで2スペース）を使用すること
6. 文書の開始と終了には"---"と"..."を使用すること
7. 各エントリは"-"で始めること

完全なYAMLドキュメントのみを出力し、これ以外の文字を含めないでください。
`;
  }

  // 汎用世界観要素リストのJSONテンプレート（新規追加）
  private getGenericWorldBuildingListJsonTemplate(): string {
    return `
以下の厳密なJSONフォーマットで出力してください:

[
  {"name": "要素の名前1", "type": "要素の種類"},
  {"name": "要素の名前2", "type": "要素の種類"},
  {"name": "要素の名前3", "type": "要素の種類"}
]

重要な注意:
- 上記の厳密なJSONフォーマットのみを返してください
- コードブロック(\`\`\`json)やその他のマークダウン記法は使わないでください
- 特殊なマーカー記号(**、##、--など)は使わないでください
- 説明文や前置き、後置きは一切不要です
- 純粋なJSON配列のみを返してください
- すべてのテキストは通常の平文で記述し、特殊書式は使用しないでください
`;
  }

  // 汎用世界観要素リストのYAMLテンプレート（新規追加）
  private getGenericWorldBuildingListYamlTemplate(): string {
    return `
以下の厳密なYAMLフォーマットで出力してください:

---
- name: 要素の名前1
  type: 要素の種類
- name: 要素の名前2
  type: 要素の種類
- name: 要素の名前3
  type: 要素の種類
...

重要な注意:
- 上記の厳密なYAMLフォーマットのみを返してください
- コードブロック(\`\`\`yaml)やその他のマークダウン記法は使わないでください
- 特殊なマーカー記号(**、##、--など)は使わないでください
- 説明文や前置き、後置きは一切不要です
- 正確なインデント（各レベルで2スペース）を使用してください
- すべてのテキストは通常の平文で記述し、特殊書式は使用しないでください
`;
  }

  // Gemini向け汎用世界観要素リストのJSONテンプレート（新規追加）
  private getGeminiGenericWorldBuildingListJsonTemplate(): string {
    return `
  以下の内容を正確なJSONフォーマットで出力してください。最終的な出力は有効なJSON配列のみにしてください。

  [
    {"name": "要素の名前1(日本語で出力すること)", "type": "要素の種類(英語で、下記制約条件から選択すること)"},
    {"name": "要素の名前2(日本語で出力すること)", "type": "要素の種類(英語で、下記制約条件から選択すること)"},
    {"name": "要素の名前3(日本語で出力すること)", "type": "要素の種類(英語で、下記制約条件から選択すること)"},
    {"name": "要素の名前4(日本語で出力すること)", "type": "要素の種類(英語で、下記制約条件から選択すること)"},
    {"name": "要素の名前5(日本語で出力すること)", "type": "要素の種類(英語で、下記制約条件から選択すること)"}
  ]

  制約条件:
  1. マークダウン記法、コードブロック、特殊記号は一切使用しない
  2. 出力は上記のJSON配列形式のみ
  3. 余分な説明や前置き・後置きは含めない
  4. 各エントリは必ず"name"と"type"フィールドを含むこと
  5. すべての文字列値は二重引用符("")で囲むこと
  6. 配列の先頭と末尾には角括弧([])を使用すること
  7. 各オブジェクトはカンマで区切ること
  8. 最後のオブジェクトの後にはカンマを付けないこと
  9. 要素の種類で設定可能なのは、
  'setting','rule','place','culture',
  'geography_environment','history_legend','magic_technology',
  'free_field','state_definition',
  です。
  10. **必須要件**: 場所（place）要素を最低3件生成してください
  11. プロジェクトのあらすじ、プロット、キャラクター情報を参考にして、物語の世界観に適した要素を生成してください
  12. 現代・近未来設定の場合は魔法関連要素を避け、技術やシステムに関する要素を優先してください
  13. ファンタジー設定の場合は魔法や伝説に関する要素を含めてください
  14. 要素の名前は日本語で出力してください
  15. 要素の種類は英語で出力してください
  16. 物語の舞台や設定に矛盾しない要素のみを生成してください
  17. 最低5件、最大10件の要素を生成してください

  完全なJSON配列のみを出力し、これ以外の文字を含めないでください。
  `;
  }

  // Gemini向け汎用世界観要素リストのYAMLテンプレート（新規追加）
  private getGeminiGenericWorldBuildingListYamlTemplate(): string {
    return `
以下の内容を正確なYAMLフォーマットで出力してください。最終的な出力はYAMLドキュメントのみにしてください。

---
- name: 要素の名前1(日本語で出力すること)
  type: 要素の種類(英語で、下記8. の種別から選択すること)
- name: 要素の名前2(日本語で出力すること)
  type: 要素の種類(英語で、下記8. の種別から選択すること)
- name: 要素の名前3(日本語で出力すること)
  type: 要素の種類(英語で、下記8. の種別から選択すること)
...

制約条件:
1. マークダウン記法、コードブロック、特殊記号は一切使用しない
2. 出力は上記のYAMLドキュメントのみ
3. 余分な説明や前置き・後置きは含めない
4. 各エントリは必ず"name"と"type"フィールドを含むこと
5. 正確なインデント（各レベルで2スペース）を使用すること
6. 文書の開始と終了には"---"と"..."を使用すること
7. 各エントリは"-"で始めること
8. 要素の種類で設定可能なのは、
'setting','rule','place','culture',
'geography_environment','history_legend','magic_technology',
'free_field','state_definition',
です。
9. あらすじやプロットから、過不足なく世界観要素を生成してください。
10. 要素の名前は日本語で出力してください。
11. 要素の種類は英語で出力してください。

完全なYAMLドキュメントのみを出力し、これ以外の文字を含めないでください。
`;
  }
}

// シングルトンインスタンス
export const templateManager = new TemplateManager();

export default templateManager;
