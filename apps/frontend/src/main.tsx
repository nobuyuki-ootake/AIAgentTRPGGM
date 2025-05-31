import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { v4 as uuidv4 } from "uuid";
import { NovelProject } from "@novel-ai-assistant/types";
import { convertTextToSlateValue } from "./utils/slateUtils";

// Recoil用の回避策を追加（修正版）
if (!("__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED" in React)) {
  Object.defineProperty(
    React,
    "__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED",
    {
      configurable: true,
      value: {
        ReactCurrentOwner: { current: null },
        ReactCurrentDispatcher: { current: { readContext: () => {} } },
      },
    }
  );
}

// 開発用のダミーデータを作成
const dummyProject: NovelProject = {
  id: uuidv4(),
  title: "思考が現実になる世界",
  createdAt: new Date(),
  updatedAt: new Date(),
  synopsis:
    "主人公が思ったことが現実になる能力を手に入れ、その力を使って世界を変えていく物語。",
  plot: [
    {
      id: uuidv4(),
      title: "能力の発見",
      description: "主人公が自分の思考が現実になることに気づく",
      order: 1,
      status: "決定",
    },
    {
      id: uuidv4(),
      title: "能力の制御",
      description: "能力をコントロールする方法を学ぶ",
      order: 2,
      status: "検討中",
    },
    {
      id: uuidv4(),
      title: "世界への影響",
      description: "能力を使って世界に変化をもたらす",
      order: 3,
      status: "検討中",
    },
  ],
  characters: [
    {
      id: uuidv4(),
      name: "山田太郎",
      role: "protagonist",
      description: "平凡なサラリーマンだったが、思考が現実になる能力を得る",
      background: "東京在住の28歳のサラリーマン",
      motivation: "この能力を使って世界をより良くしたい",
      traits: [
        {
          id: uuidv4(),
          name: "責任感",
          value: "強い",
        },
      ],
      relationships: [],
    },
  ],
  worldBuilding: {
    id: uuidv4(),
    setting: [],
    worldmaps: [],
    rules: [
      {
        id: uuidv4(),
        name: "思考現実化の法則",
        type: "rule",
        originalType: "rule",
        description: "強く思ったことが現実になる",
        features: "意識的な思考のみが対象",
        importance: "高",
        relations: "主人公の能力の根幹",
        exceptions: "無意識の思考は対象外",
        origin: "不明",
      },
    ],
    places: [
      {
        id: uuidv4(),
        name: "東京",
        type: "place",
        originalType: "place",
        description: "物語の主な舞台",
        features: "現代的な都市",
        importance: "高",
        relations: "主人公の生活の場",
        location: "日本",
        population: "1400万人",
        culturalFeatures: "多様性に富む",
      },
    ],
    cultures: [],
    geographyEnvironment: [],
    historyLegend: [],
    magicTechnology: [],
    stateDefinition: [],
    freeFields: [],
  },
  timeline: [
    {
      id: uuidv4(),
      title: "能力の発見",
      description: "主人公が思考現実化能力に気づく",
      date: "2024-01-01",
      relatedCharacters: [],
      relatedPlaces: [],
      order: 1,
    },
  ],
  chapters: [
    {
      id: uuidv4(),
      title: "序章：能力の発見",
      synopsis:
        "平凡な日常を送っていた主人公が、自分の思ったことが現実になる能力に気づく。",
      content: convertTextToSlateValue(
        "山田太郎は、いつもと変わらない月曜日の朝を迎えていた。満員電車に揺られながら、「今日は早く帰りたいな」と考えていた。\n\nそして不思議なことに、その日は予定されていた会議がすべてキャンセルとなり、上司から「今日は早く帰っていいよ」と言われた。偶然だと思った太郎だったが、次に「雨が降らないといいな」と思った瞬間、曇っていた空が晴れ渡った。"
      ),
      order: 1,
      scenes: [],
    },
  ],
  feedback: [],
};

// ローカルストレージにプロジェクトリストを保存する関数
const saveProjectsToLocalStorage = (projects: NovelProject[]) => {
  localStorage.setItem("novelProjects", JSON.stringify(projects));
};

// 既存データを新しい形式に移行する関数
const migrateExistingData = () => {
  const projectsStr = localStorage.getItem("novelProjects");
  if (projectsStr) {
    try {
      const projects = JSON.parse(projectsStr) as NovelProject[];
      let needsMigration = false;

      const migratedProjects = projects.map((project) => {
        const migratedChapters = project.chapters.map((chapter) => {
          // contentがstring型の場合、Descendant[]に変換
          if (typeof chapter.content === "string") {
            needsMigration = true;
            return {
              ...chapter,
              content: convertTextToSlateValue(chapter.content),
            };
          }
          return chapter;
        });

        return {
          ...project,
          chapters: migratedChapters,
        };
      });

      if (needsMigration) {
        console.log("Migrating existing data to new format...");
        saveProjectsToLocalStorage(migratedProjects);
        console.log("Data migration completed.");
      }
    } catch (error) {
      console.error("Error during data migration:", error);
    }
  }
};

// 初期化処理
const initializeApp = () => {
  // 既存データの移行
  migrateExistingData();

  // プロジェクトリストの初期化
  const projectsStr = localStorage.getItem("novelProjects");
  if (!projectsStr) {
    saveProjectsToLocalStorage([dummyProject]);
  }
};

// アプリ初期化
initializeApp();

// ローカルストレージからプロジェクトリストを読み込む関数
const loadProjectsFromLocalStorage = (): NovelProject[] => {
  const data = localStorage.getItem("novelProjects");
  return data ? JSON.parse(data) : [];
};

// デバッグログを追加
console.log("main.tsx実行中...");
console.log("ルート要素:", document.getElementById("root"));

// プロジェクトリストをチェックし、なければダミーデータを追加
const projects = loadProjectsFromLocalStorage();
if (projects.length === 0) {
  console.log("ダミープロジェクトを追加します");
  projects.push(dummyProject);
  saveProjectsToLocalStorage(projects);

  // LocalStorageManagerに対応する形式で保存
  console.log("LocalStorageManager形式でも保存します");
  const projectForManager = {
    id: dummyProject.id,
    name: dummyProject.title,
    description: dummyProject.synopsis,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    characters: dummyProject.characters,
    worldBuilding: dummyProject.worldBuilding,
    timeline: dummyProject.timeline,
    chapters: dummyProject.chapters,
    metadata: {
      version: "1.0",
      status: "active",
    },
  };

  // LocalStorageManagerのプロジェクトリストに追加
  const projectList = localStorage.getItem("novel_project_list") || "[]";
  const parsedList = JSON.parse(projectList);
  parsedList.push({
    id: dummyProject.id,
    name: dummyProject.title,
    updatedAt: new Date().toISOString(),
  });
  localStorage.setItem("novel_project_list", JSON.stringify(parsedList));

  // プロジェクトデータも保存
  localStorage.setItem(
    `novel_project_${dummyProject.id}`,
    JSON.stringify(projectForManager)
  );
}

try {
  console.log("Reactレンダリング開始");
  const root = document.getElementById("root");
  if (!root) {
    console.error("ルート要素が見つかりません！");
  } else {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("レンダリング完了");
  }
} catch (error) {
  console.error("レンダリングエラー:", error);
}
