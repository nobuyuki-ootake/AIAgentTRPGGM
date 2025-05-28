import { v4 as uuidv4 } from "uuid";
import { Character, PlotElement } from "@novel-ai-assistant/types";

/**
 * AI応答からキャラクターを解析する関数
 */
export const parseAIResponseToCharacter = (
  aiResponse: string
): Character | null => {
  const character: Partial<Character> = {
    id: uuidv4(), // Always generate a new ID
    traits: [],
    statuses: [],
    customFields: [],
    relationships: [],
  };

  const nameMatch = aiResponse.match(/名前[：:]\s*(.+?)($|\n)/);
  if (nameMatch && nameMatch[1]) character.name = nameMatch[1].trim();

  const roleMatch = aiResponse.match(/役割[：:]\s*(主人公|敵役|脇役)($|\n)/);
  if (roleMatch && roleMatch[1]) {
    const roleMap: Record<string, Character["role"]> = {
      主人公: "protagonist",
      敵役: "antagonist",
      脇役: "supporting",
    };
    character.role = roleMap[roleMatch[1]] || "supporting";
  }

  const genderMatch = aiResponse.match(/性別[：:]\s*(.+?)($|\n)/);
  if (genderMatch && genderMatch[1]) character.gender = genderMatch[1].trim();

  const backgroundMatch = aiResponse.match(/背景[：:]\s*(.+?)(\n\n|\n[^:]|$)/s);
  if (backgroundMatch && backgroundMatch[1]) {
    character.background = backgroundMatch[1].trim();
  }

  const motivationMatch = aiResponse.match(/動機[：:]\s*(.+?)(\n\n|\n[^:]|$)/s);
  if (motivationMatch && motivationMatch[1]) {
    character.motivation = motivationMatch[1].trim();
  }

  const descriptionMatch = aiResponse.match(
    /説明[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
  );
  if (descriptionMatch && descriptionMatch[1]) {
    character.description = descriptionMatch[1].trim();
  }

  const appearanceMatch = aiResponse.match(/外見[：:]\s*(.+?)(\n\n|\n[^:]|$)/s);
  if (appearanceMatch && appearanceMatch[1]) {
    character.appearance = appearanceMatch[1].trim();
  }

  const personalityMatch = aiResponse.match(
    /性格[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
  );
  if (personalityMatch && personalityMatch[1]) {
    character.personality = personalityMatch[1].trim();
  }

  const traitsMatch = aiResponse.match(/特性[：:]\s*(.+?)(\n\n|\n[^:]|$)/s);
  if (traitsMatch && traitsMatch[1]) {
    character.traits = traitsMatch[1]
      .split(/[,、]/)
      .map((t) => t.trim())
      .filter((t) => t)
      .map((traitValue) => ({
        id: uuidv4(),
        name: traitValue,
        value: traitValue,
      }));
  }

  if (!character.name) return null; // Basic validation: name is required
  return character as Character;
};

/**
 * AI応答から複数のキャラクターを解析する関数（バッチ処理対応）
 */
export const parseAIResponseToCharacters = (
  aiResponse: string
): Character[] => {
  const characters: Character[] = [];

  try {
    // JSONとして解析を試行
    const parsed = JSON.parse(aiResponse);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          const character = parseAIResponseToCharacter(JSON.stringify(item));
          return character || createDefaultCharacter();
        })
        .filter(Boolean);
    }
  } catch {
    // JSON解析に失敗した場合、テキストから抽出
  }

  // バッチ処理の結果（【キャラクター1】形式）をパース
  const characterBlocks = aiResponse.split(/={50,}/);

  for (const block of characterBlocks) {
    if (block.trim()) {
      // 【キャラクター】ブロックから情報を抽出
      const characterMatch = block.match(
        /【キャラクター\d+】\s*([\s\S]*?)(?=【キャラクター\d+】|$)/
      );
      if (characterMatch) {
        const characterText = characterMatch[1];
        const character = parseCharacterFromFormattedText(characterText);
        if (character) {
          characters.push(character);
        }
      } else {
        // 従来の形式でパースを試行
        const character = parseAIResponseToCharacter(block);
        if (character) {
          characters.push(character);
        }
      }
    }
  }

  // 【キャラクター】形式が見つからない場合、直接パターンマッチング
  if (characters.length === 0) {
    const characterMatches = aiResponse.matchAll(
      /【キャラクター\d+】\s*([\s\S]*?)(?=【キャラクター\d+】|={50,}|$)/g
    );
    for (const match of characterMatches) {
      if (match[1]) {
        const character = parseCharacterFromFormattedText(match[1]);
        if (character) {
          characters.push(character);
        }
      }
    }
  }

  // キャラクターが見つからない場合、従来の方法を試行
  if (characters.length === 0) {
    const lines = aiResponse.split("\n").filter((line) => line.trim());
    for (const line of lines) {
      const character = parseAIResponseToCharacter(line);
      if (character) {
        characters.push(character);
      }
    }
  }

  console.log(
    `parseAIResponseToCharacters: ${characters.length}件のキャラクターを解析しました`
  );
  return characters;
};

/**
 * フォーマット済みテキストからキャラクター情報を抽出
 */
function parseCharacterFromFormattedText(text: string): Character | null {
  const character: Partial<Character> = {
    id: uuidv4(),
    traits: [],
    statuses: [],
    customFields: [],
    relationships: [],
  };

  console.log(
    "parseCharacterFromFormattedText: 解析対象テキスト:",
    text.substring(0, 200) + "..."
  );

  // 基本情報の抽出
  const nameMatch = text.match(/名前[：:]\s*(.+?)($|\n)/);
  if (nameMatch && nameMatch[1]) {
    character.name = nameMatch[1].trim();
  }

  const roleMatch = text.match(/役割[：:]\s*(主人公|敵役|脇役)($|\n)/);
  if (roleMatch && roleMatch[1]) {
    const roleMap: Record<string, Character["role"]> = {
      主人公: "protagonist",
      敵役: "antagonist",
      脇役: "supporting",
    };
    character.role = roleMap[roleMatch[1]] || "supporting";
  }

  const importanceMatch = text.match(/重要度[：:]\s*(.+?)($|\n)/);
  if (importanceMatch && importanceMatch[1]) {
    // 重要度は特性として追加
    character.traits = character.traits || [];
    character.traits.push({
      id: uuidv4(),
      name: "重要度",
      value: importanceMatch[1].trim(),
    });
  }

  const summaryMatch = text.match(/概要[：:]\s*(.+?)(\n\n|\n詳細|$)/s);
  if (summaryMatch && summaryMatch[1]) {
    character.description = summaryMatch[1].trim();
  }

  // 詳細情報の抽出
  const detailsMatch = text.match(/詳細[：:]\s*([\s\S]*?)$/);
  if (detailsMatch && detailsMatch[1]) {
    const detailsText = detailsMatch[1].trim();

    // 詳細から追加情報を抽出
    const genderMatch = detailsText.match(/gender[：:]\s*(.+?)($|\n)/);
    if (genderMatch && genderMatch[1]) {
      character.gender = genderMatch[1].trim();
    }

    const ageMatch = detailsText.match(/age[：:]\s*(.+?)($|\n)/);
    if (ageMatch && ageMatch[1]) {
      character.age = ageMatch[1].trim();
    }

    const backgroundMatch = detailsText.match(
      /background[：:]\s*(.+?)(\n\n|\n[a-zA-Z]+[：:]|$)/s
    );
    if (backgroundMatch && backgroundMatch[1]) {
      character.background = backgroundMatch[1].trim();
    }

    const motivationMatch = detailsText.match(
      /motivation[：:]\s*(.+?)(\n\n|\n[a-zA-Z]+[：:]|$)/s
    );
    if (motivationMatch && motivationMatch[1]) {
      character.motivation = motivationMatch[1].trim();
    }

    const appearanceMatch = detailsText.match(
      /外見[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
    );
    if (appearanceMatch && appearanceMatch[1]) {
      character.appearance = appearanceMatch[1].trim();
    }

    const personalityMatch = detailsText.match(
      /性格[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
    );
    if (personalityMatch && personalityMatch[1]) {
      character.personality = personalityMatch[1].trim();
    }

    // traitsの抽出
    const traitsMatch = detailsText.match(
      /traits[：:]\s*([\s\S]*?)(\n\n|\n[a-zA-Z]+[：:]|$)/
    );
    if (traitsMatch && traitsMatch[1]) {
      const traitsText = traitsMatch[1].trim();
      // リスト形式の特性を抽出
      const traitItems = traitsText.match(/- (.+)/g);
      if (traitItems) {
        character.traits = character.traits || [];
        traitItems.forEach((item) => {
          const traitValue = item.replace(/^- /, "").trim();
          if (traitValue) {
            character.traits!.push({
              id: uuidv4(),
              name: traitValue,
              value: traitValue,
            });
          }
        });
      }
    }

    // 詳細全体をdescriptionに追加（既存のdescriptionがない場合）
    if (!character.description) {
      character.description = detailsText;
    }
  }

  // 名前が必須
  if (!character.name) {
    console.warn("parseCharacterFromFormattedText: 名前が見つかりませんでした");
    return null;
  }

  console.log("parseCharacterFromFormattedText: 解析完了:", character.name);
  return character as Character;
}

/**
 * デフォルトキャラクターを作成
 */
function createDefaultCharacter(): Character {
  return {
    id: uuidv4(),
    name: "名前未設定",
    role: "supporting",
    description: "",
    background: "",
    motivation: "",
    traits: [],
    statuses: [],
    customFields: [],
    relationships: [],
  };
}

/**
 * AI応答からプロットアイテムを解析する関数
 */
export const parseAIResponseToPlotItems = (
  aiResponse: string
): Partial<PlotElement>[] => {
  try {
    // JSONとして解析を試行
    const parsed = JSON.parse(aiResponse);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [parsed];
  } catch {
    // JSON解析に失敗した場合、テキストから抽出
    const plotItems: Partial<PlotElement>[] = [];

    // プロットアイテムのパターンを検索
    const plotItemPattern =
      /プロットアイテム\d+\s*\n?タイトル[：:]\s*(.+?)\s*\n?詳細[：:]\s*(.+?)(?=\n\nプロットアイテム|\n\n[^プ]|$)/gs;

    let match;
    while ((match = plotItemPattern.exec(aiResponse)) !== null) {
      const title = match[1]?.trim();
      const description = match[2]?.trim();

      if (title && description) {
        plotItems.push({
          id: uuidv4(),
          title,
          description,
          status: "検討中" as const,
        });
      }
    }

    // パターンマッチングで見つからない場合、従来の方法を試行
    if (plotItems.length === 0) {
      const lines = aiResponse.split("\n").filter((line) => line.trim());
      return lines.map((line, index) => ({
        id: uuidv4(),
        title: `プロット${index + 1}`,
        description: line.trim(),
        status: "検討中" as const,
      }));
    }

    return plotItems;
  }
};
