import type { Meta, StoryObj } from "@storybook/react";
import { RecoilRoot } from "recoil";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../../pages/HomePage";
import { NovelProject } from "@novel-ai-assistant/types";
import { v4 as uuidv4 } from "uuid";

// モックプロジェクトデータ
const mockProjects: NovelProject[] = [
  {
    id: uuidv4(),
    title: "ファンタジー小説",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-10"),
    synopsis: "魔法の世界を冒険する若者の物語",
    plot: [],
    characters: [],
    worldBuilding: {
      id: uuidv4(),
      setting: "",
      rules: [],
      places: [],
      cultures: [],
      historyLegend: [],
      worldmaps: [],
      settings: [],
      geographyEnvironment: [],
      magicTechnology: [],
      stateDefinition: [],
      freeFields: [],
    },
    timeline: [],
    chapters: [],
    feedback: [],
  },
  {
    id: uuidv4(),
    title: "ミステリー小説",
    createdAt: new Date("2023-02-01"),
    updatedAt: new Date("2023-02-15"),
    synopsis: "田舎町で起こった連続殺人事件の謎を追う刑事の物語",
    plot: [],
    characters: [],
    worldBuilding: {
      id: uuidv4(),
      setting: "",
      rules: [],
      places: [],
      cultures: [],
      historyLegend: [],
      worldmaps: [],
      settings: [],
      geographyEnvironment: [],
      magicTechnology: [],
      stateDefinition: [],
      freeFields: [],
    },
    timeline: [],
    chapters: [],
    feedback: [],
  },
  {
    id: uuidv4(),
    title: "SF小説",
    createdAt: new Date("2023-03-01"),
    updatedAt: new Date("2023-03-20"),
    synopsis: "未来の宇宙を舞台にした人類と異星人の物語",
    plot: [],
    characters: [],
    worldBuilding: {
      id: uuidv4(),
      setting: "",
      rules: [],
      places: [],
      cultures: [],
      historyLegend: [],
      worldmaps: [],
      settings: [],
      geographyEnvironment: [],
      magicTechnology: [],
      stateDefinition: [],
      freeFields: [],
    },
    timeline: [],
    chapters: [],
    feedback: [],
  },
];

const meta: Meta<typeof HomePage> = {
  title: "Pages/HomePage",
  component: HomePage,
  decorators: [
    (Story) => (
      <RecoilRoot>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </RecoilRoot>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof HomePage>;

export const NoProjects: Story = {
  args: {
    projects: [],
    currentProject: null,
  },
};

export const WithProjects: Story = {
  args: {
    projects: mockProjects,
    currentProject: mockProjects[0],
  },
};
