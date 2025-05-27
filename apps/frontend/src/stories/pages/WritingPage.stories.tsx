import { Meta, StoryObj } from "@storybook/react";
import { RecoilRoot } from "recoil";
import WritingPage from "../../pages/WritingPage";
import { v4 as uuidv4 } from "uuid";

// モックデータ
const mockChapters = [
  {
    id: uuidv4(),
    title: "第1章: 魔法との出会い",
    content:
      "森の奥深くで、主人公のアレックスは偶然古い杖を見つけた。それは彼の人生を永遠に変える出会いとなった。",
    order: 0,
  },
  {
    id: uuidv4(),
    title: "第2章: 魔法学校",
    content: "招待状は一羽の鳥によって届けられた。",
    order: 1,
  },
];

const mockProject = {
  id: uuidv4(),
  title: "ファンタジー小説",
  createdAt: new Date(),
  updatedAt: new Date(),
  synopsis: "魔法の世界を冒険する若者の物語",
  plot: [],
  characters: [],
  worldBuilding: {
    id: uuidv4(),
    setting: "",
    rules: [],
    places: [],
    cultures: [],
    history: "",
    freeFields: [],
  },
  timeline: [],
  chapters: [],
  feedback: [],
};

const meta: Meta<typeof WritingPage> = {
  title: "Pages/WritingPage",
  component: WritingPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <RecoilRoot>
        <Story />
      </RecoilRoot>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WritingPage>;

export const StandardView: Story = {
  args: {
    currentProject: mockProject,
    chapters: mockChapters,
    activeChapter: mockChapters[0],
  },
};

export const EmptyWriting: Story = {
  args: {
    currentProject: mockProject,
    chapters: [],
    activeChapter: null,
  },
};
