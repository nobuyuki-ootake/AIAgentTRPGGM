import { createTheme } from "@mui/material/styles";
// @fontsource系モジュールは型定義がないためコメントアウト
// import "@fontsource/noto-sans-jp";
// import "@fontsource/noto-serif-jp";

// テーマの作成
const theme = createTheme({
  palette: {
    primary: {
      main: "#3f51b5",
    },
    secondary: {
      main: "#f50057",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: ["Noto Sans JP", "Roboto", "Arial", "sans-serif"].join(","),
    h1: {
      fontFamily: "Noto Serif JP, serif",
    },
    h2: {
      fontFamily: "Noto Serif JP, serif",
    },
    h3: {
      fontFamily: "Noto Serif JP, serif",
    },
    h4: {
      fontFamily: "Noto Serif JP, serif",
    },
    h5: {
      fontFamily: "Noto Serif JP, serif",
    },
    h6: {
      fontFamily: "Noto Serif JP, serif",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#888",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#555",
          },
        },
      },
    },
  },
});

export default theme;
