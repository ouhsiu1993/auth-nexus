// src/theme/index.js
import { extendTheme } from '@chakra-ui/react';
import colors from './colors';
import components from './components';

// 全域樣式覆蓋
const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.900',
    },
  },
};

// 字型配置
const fonts = {
  heading: 'Inter, "Noto Sans TC", sans-serif',
  body: 'Inter, "Noto Sans TC", sans-serif',
};

// 斷點
const breakpoints = {
  sm: '320px',
  md: '768px',
  lg: '960px',
  xl: '1200px',
  '2xl': '1536px',
};

// 合併所有配置
const theme = extendTheme({
  colors,
  components,
  styles,
  fonts,
  breakpoints,
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme;