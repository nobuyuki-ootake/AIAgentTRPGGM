import { Meta, StoryObj } from "@storybook/react";
import { RecoilRoot } from "recoil";
import PlotPage from "../../pages/PlotPage";
import { v4 as uuidv4 } from "uuid";

// モックデータ
const mockPlotItems = [
  {
    id: uuidv4(),
    title: "主人公が魔法の杖を発見",
    description: "森の奥で古代の魔法の杖を偶然発見する",
    type: "イベント",
    order: 0,
  },
  {
    id: uuidv4(),
    title: "魔法学校への入学",
    description: "魔法の才能を認められ、隠された魔法学校への招待状が届く",
    type: "イベント",
    order: 1,
  },
  {
    id: uuidv4(),
    title: "最初の試練",
    description: "学校での最初の試練で困難に直面するが、新しい友人の助けを得る",
    type: "転機",
    order: 2,
  },
];

const meta: Meta<typeof PlotPage> = {
  title: "Pages/PlotPage",
  component: PlotPage,
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
type Story = StoryObj<typeof PlotPage>;

export const StandardView: Story = {
  args: {
    plotItems: mockPlotItems,
  },
};

export const EmptyPlot: Story = {
  args: {
    plotItems: [],
  },
};
