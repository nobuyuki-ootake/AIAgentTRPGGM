import {
  selector,
  // selectorFamily,
  // DefaultValue, // 未使用のためコメントアウト
} from "recoil";
import { GameSession } from "@trpg-ai-gm/types";
import { currentCampaignState, currentSessionIdState } from "./atoms";

// 現在選択されている章を取得するセレクタ
export const currentChapterSelector = selector<GameSession | null>({
  key: "currentChapter",
  get: ({ get }) => {
    const currentCampaign = get(currentCampaignState);
    const currentSessionId = get(currentSessionIdState);

    if (!currentCampaign || !currentSessionId) {
      return null;
    }

    const foundChapter =
      currentCampaign.sessions?.find(
        (session) => session.id === currentSessionId
      ) || null;

    return foundChapter;
  },
});

// 章の順序でソートされた章リストを取得するセレクタ
export const sortedChaptersSelector = selector({
  key: "sortedChapters",
  get: ({ get }) => {
    const currentCampaign = get(currentCampaignState);

    if (!currentCampaign) {
      return [];
    }

    return [...(currentCampaign.sessions || [])].sort((a, b) => a.sessionNumber - b.sessionNumber);
  },
});

// キャラクター名の一覧を取得するセレクタ
export const characterNamesSelector = selector({
  key: "characterNames",
  get: ({ get }) => {
    const currentCampaign = get(currentCampaignState);

    if (!currentCampaign) {
      return [];
    }

    return currentCampaign.characters.map((character) => ({
      id: character.id,
      name: character.name,
      characterType: character.characterType,
    }));
  },
});
