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
 * AI応答から複数のキャラクターを解析する関数
 */
export const parseAIResponseToCharacters = (
  aiResponse: string
): Character[] => {
  // キャラクターブロックを分離（"---"または"-----"で区切られていると仮定）
  const characterBlocks = aiResponse.split(/\n-----\n|\n---\n/);
  return characterBlocks
    .map((block) => parseAIResponseToCharacter(block.trim()))
    .filter((char): char is Character => char !== null);
};

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
    const lines = aiResponse.split("\n").filter((line) => line.trim());
    return lines.map((line, index) => ({
      title: `プロット${index + 1}`,
      description: line.trim(),
    }));
  }
};
