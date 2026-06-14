import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        grass: '#4a7c59',
        grassLight: '#6ab04c',
        soil: '#8B6914',
        sky: '#87CEEB',
        chatBg: '#0d1117',
        bubbleMine: '#005c4b',
        bubbleOther: '#1e2a35',
        chatText: '#e9edef',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        chat: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
