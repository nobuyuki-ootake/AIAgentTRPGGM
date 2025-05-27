import { Meta, StoryObj } from "@storybook/react";
import { RecoilRoot } from "recoil";
import SynopsisPage from "../../pages/SynopsisPage";
import { v4 as uuidv4 } from "uuid";

const meta: Meta<typeof SynopsisPage> = {
  title: "Pages/SynopsisPage",
  component: SynopsisPage,
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
type Story = StoryObj<typeof SynopsisPage>;

export const NoProject: Story = {
  args: {
    currentProject: null,
    synopsis: "",
    isEditing: false,
    showAlertDialog: false,
  },
};

export const EmptySynopsis: Story = {
  args: {
    currentProject: {
      id: uuidv4(),
      title: "新しい小説プロジェクト",
      createdAt: new Date(),
      updatedAt: new Date(),
      synopsis: "",
      plot: [],
      characters: [],
      worldBuilding: {
        id: uuidv4(),
        setting: "",
        rules: [],
        places: [],
        cultures: [],
        history: "",
      },
      timeline: [],
      chapters: [],
      feedback: [],
    },
    synopsis: "",
    isEditing: false,
    showAlertDialog: false,
  },
};

export const ViewMode: Story = {
  args: {
    currentProject: {
      id: uuidv4(),
      title: "ファンタジー小説",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-10"),
      synopsis:
        "魔法の力を持つ少年が、失われた古代の秘宝を探す冒険に出る物語。\n\n魔法学校で学ぶ主人公は、伝説の秘宝「ドラゴンの心臓」が実在することを知り、それを探す旅に出る。途中で信頼できる仲間たちと出会い、敵対する闇の組織と対決しながら、自らの使命と力に目覚めていく。\n\n最終的には、秘宝が単なる力の源ではなく、失われた魔法文明と現代をつなぐ鍵であることを発見し、世界の危機を救うことになる。",
      plot: [],
      characters: [],
      worldBuilding: {
        id: uuidv4(),
        setting: "",
        rules: [],
        places: [],
        cultures: [],
        history: "",
      },
      timeline: [],
      chapters: [],
      feedback: [],
    },
    synopsis:
      "魔法の力を持つ少年が、失われた古代の秘宝を探す冒険に出る物語。\n\n魔法学校で学ぶ主人公は、伝説の秘宝「ドラゴンの心臓」が実在することを知り、それを探す旅に出る。途中で信頼できる仲間たちと出会い、敵対する闇の組織と対決しながら、自らの使命と力に目覚めていく。\n\n最終的には、秘宝が単なる力の源ではなく、失われた魔法文明と現代をつなぐ鍵であることを発見し、世界の危機を救うことになる。",
    isEditing: false,
    showAlertDialog: false,
  },
};

export const EditMode: Story = {
  args: {
    currentProject: {
      id: uuidv4(),
      title: "ファンタジー小説",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-10"),
      synopsis:
        "魔法の力を持つ少年が、失われた古代の秘宝を探す冒険に出る物語。\n\n魔法学校で学ぶ主人公は、伝説の秘宝「ドラゴンの心臓」が実在することを知り、それを探す旅に出る。途中で信頼できる仲間たちと出会い、敵対する闇の組織と対決しながら、自らの使命と力に目覚めていく。\n\n最終的には、秘宝が単なる力の源ではなく、失われた魔法文明と現代をつなぐ鍵であることを発見し、世界の危機を救うことになる。",
      plot: [],
      characters: [],
      worldBuilding: {
        id: uuidv4(),
        setting: "",
        rules: [],
        places: [],
        cultures: [],
        history: "",
      },
      timeline: [],
      chapters: [],
      feedback: [],
    },
    synopsis:
      "魔法の力を持つ少年が、失われた古代の秘宝を探す冒険に出る物語。\n\n魔法学校で学ぶ主人公は、伝説の秘宝「ドラゴンの心臓」が実在することを知り、それを探す旅に出る。途中で信頼できる仲間たちと出会い、敵対する闇の組織と対決しながら、自らの使命と力に目覚めていく。\n\n最終的には、秘宝が単なる力の源ではなく、失われた魔法文明と現代をつなぐ鍵であることを発見し、世界の危機を救うことになる。",
    isEditing: true,
    showAlertDialog: false,
  },
};
