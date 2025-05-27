import { RecoilRoot } from "recoil";
import React from "react";

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) =>
      React.createElement(RecoilRoot, null, React.createElement(Story)),
  ],
};

export default preview;
