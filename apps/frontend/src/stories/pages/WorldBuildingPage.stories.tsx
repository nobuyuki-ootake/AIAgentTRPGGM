import type { Meta, StoryObj } from "@storybook/react";
import { RecoilRoot } from "recoil";
import WorldBuildingPage from "../../pages/WorldBuildingPage";
import { NovelProject } from "@novel-ai-assistant/types";
import { v4 as uuidv4 } from "uuid";

// モックデータ
const mockProject: NovelProject = {
  id: uuidv4(),
  title: "ファンタジー小説",
  createdAt: new Date(),
  updatedAt: new Date(),
  synopsis: "魔法の世界を冒険する若者の物語",
  plot: [],
  characters: [],
  worldBuilding: {
    id: uuidv4(),
    setting: [],
    rules: [
      {
        id: "rule1",
        name: "魔力消費",
        description: "魔法は魔力という資源を消費する",
        features: "魔法使いの能力に制限を設ける",
        impact: "魔法使いの能力に制限を設ける",
        exceptions: "魔法使いの能力に制限を設ける",
        origin: "魔法使いの能力に制限を設ける",
        type: "魔法使いの能力に制限を設ける",
        originalType: "rule",
        importance: "魔法使いの能力に制限を設ける",
        relations: "魔法使いの能力に制限を設ける",
      },
      {
        id: "rule2",
        name: "知的ドラゴン",
        description: "ドラゴンは知性を持ち人間語を話せる",
        features: "ドラゴンとの交渉や同盟が可能",
        impact: "ドラゴンとの交渉や同盟が可能",
        exceptions: "ドラゴンとの交渉や同盟が可能",
        origin: "ドラゴンとの交渉や同盟が可能",
        type: "ドラゴンとの交渉や同盟が可能",
        originalType: "rule",
        importance: "ドラゴンとの交渉や同盟が可能",
        relations: "ドラゴンとの交渉や同盟が可能",
      },
      {
        id: "rule3",
        name: "血統魔法",
        description: "魔法は血統により才能が決まる",
        features: "社会階級と魔法の関係性",
        impact: "社会階級と魔法の関係性",
        exceptions: "社会階級と魔法の関係性",
        origin: "社会階級と魔法の関係性",
        type: "社会階級と魔法の関係性",
        originalType: "rule",
        importance: "社会階級と魔法の関係性",
        relations: "社会階級と魔法の関係性",
      },
    ],
    places: [
      {
        id: uuidv4(),
        name: "アルマリア王国",
        description:
          "七つの王国の中で最も強大な国。豊かな森と肥沃な土地に恵まれた王国。",
        features: "物語の主要な舞台。主人公の出身地。",
        location: "city",
        population: "100000",
        culturalFeatures: "物語の主要な舞台。主人公の出身地。",
        type: "city",
        originalType: "place",
        importance: "物語の主要な舞台。主人公の出身地。",
        relations: "物語の主要な舞台。主人公の出身地。",
      },
    ],
    cultures: [],
    historyLegend: [],
    worldmaps: [],
    geographyEnvironment: [],
    magicTechnology: [],
    stateDefinition: [],
    freeFields: [],
  },
  timeline: [],
  chapters: [],
  feedback: [],
};

const meta: Meta<typeof WorldBuildingPage> = {
  title: "Pages/WorldBuildingPage",
  component: WorldBuildingPage,
  decorators: [
    (Story) => (
      <RecoilRoot>
        <Story />
      </RecoilRoot>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof WorldBuildingPage>;

export const NoProject: Story = {
  args: {
    currentProject: null,
  },
};

export const StandardView: Story = {
  args: {
    currentProject: mockProject,
  },
};
