import type { Preview } from "@storybook/react";
import { RecoilRoot } from "recoil";
import React from "react";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (StoryFn) => {
      const Story = StoryFn as React.ComponentType;
      return React.createElement(RecoilRoot, null, React.createElement(Story));
    },
  ],
};

export default preview;
