import type { Preview } from '@storybook/react-vite'
import '../src/styles/index.css'; // Import design system tokens

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#FFFFFF',
        },
        {
          name: 'dark',
          value: '#1A1A1A',
        },
        {
          name: 'gray',
          value: '#F5F5F5',
        },
      ],
    },
  },
};

export default preview;