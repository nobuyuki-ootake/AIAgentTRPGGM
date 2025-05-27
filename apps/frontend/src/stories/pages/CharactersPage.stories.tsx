import type { Meta, StoryObj } from "@storybook/react";
import { RecoilRoot } from "recoil";
import CharactersPage from "../../pages/CharactersPage";
import { Character } from "@novel-ai-assistant/types";
import { v4 as uuidv4 } from "uuid";

// モックデータ
const mockCharacters: Character[] = [
  {
    id: uuidv4(),
    name: "山田太郎",
    role: "protagonist",
    gender: "男性",
    birthDate: "2000-01-15",
    description: "物語の主人公。18歳の高校生で、特殊な能力に目覚める。",
    background: "幼い頃に両親を事故で亡くし、祖父母に育てられた。",
    motivation: "失われた家族の謎を解明し、自分の能力の真実を知ること。",
    traits: [],
    relationships: [],
    imageUrl: "https://picsum.photos/id/1012/200",
    customFields: [],
  },
  {
    id: uuidv4(),
    name: "佐藤花子",
    role: "supporting",
    gender: "女性",
    birthDate: "2001-05-20",
    description: "主人公のクラスメイト。賢く、主人公を助ける存在。",
    background: "裕福な家庭で育ち、幼い頃から優秀な成績を収めてきた。",
    motivation: "新しい知識を得ることと、友人を守ること。",
    traits: [],
    relationships: [],
    imageUrl: "https://picsum.photos/id/1027/200",
    customFields: [],
  },
];

const meta: Meta<typeof CharactersPage> = {
  title: "Pages/CharactersPage",
  component: CharactersPage,
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
type Story = StoryObj<typeof CharactersPage>;

export const NoCharacters: Story = {
  args: {
    characters: [],
    viewMode: "grid",
  },
};

export const WithCharactersGrid: Story = {
  args: {
    characters: mockCharacters,
    viewMode: "grid",
  },
};

export const WithCharactersList: Story = {
  args: {
    characters: mockCharacters,
    viewMode: "list",
  },
};
