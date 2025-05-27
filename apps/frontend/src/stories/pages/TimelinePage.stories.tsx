import { Meta, StoryObj } from "@storybook/react";
import { RecoilRoot } from "recoil";
import TimelinePage from "../../pages/TimelinePage";
import { v4 as uuidv4 } from "uuid";

// モックデータ
const mockTimelineEvents = [
  {
    id: uuidv4(),
    title: "イベント1",
    description: "イベント1の説明",
    date: "2023-01-01",
    relatedCharacters: ["1"],
    relatedPlaces: ["1"],
  },
];

const meta: Meta<typeof TimelinePage> = {
  title: "Pages/TimelinePage",
  component: TimelinePage,
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
type Story = StoryObj<typeof TimelinePage>;

export const Default: Story = {
  args: {
    timelineEvents: mockTimelineEvents,
  },
};
