import {
  selector,
  // selectorFamily,
  // DefaultValue, // 未使用のためコメントアウト
} from "recoil";
import { Chapter } from "@novel-ai-assistant/types";
import { currentProjectState, currentChapterIdState } from "./atoms";

// 現在選択されている章を取得するセレクタ
export const currentChapterSelector = selector<Chapter | null>({
  key: "currentChapter",
  get: ({ get }) => {
    const currentProject = get(currentProjectState);
    const currentChapterId = get(currentChapterIdState);

    if (!currentProject || !currentChapterId) {
      return null;
    }

    const foundChapter =
      currentProject.chapters.find(
        (chapter) => chapter.id === currentChapterId
      ) || null;

    return foundChapter;
  },
});

// 章の順序でソートされた章リストを取得するセレクタ
export const sortedChaptersSelector = selector({
  key: "sortedChapters",
  get: ({ get }) => {
    const currentProject = get(currentProjectState);

    if (!currentProject) {
      return [];
    }

    return [...currentProject.chapters].sort((a, b) => a.order - b.order);
  },
});

// キャラクター名の一覧を取得するセレクタ
export const characterNamesSelector = selector({
  key: "characterNames",
  get: ({ get }) => {
    const currentProject = get(currentProjectState);

    if (!currentProject) {
      return [];
    }

    return currentProject.characters.map((character) => ({
      id: character.id,
      name: character.name,
      role: character.role,
    }));
  },
});
