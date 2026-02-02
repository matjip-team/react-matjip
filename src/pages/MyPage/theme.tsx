import { createTheme } from "@mui/material/styles";
import { deepPurple, grey } from "@mui/material/colors";

// 전문적이고 독특한 느낌을 주는 커스텀 테마를 생성합니다.
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      // 메인 색상: 깊은 보라색 계열
      main: deepPurple[600],
    },
    secondary: {
      // 보조 색상: 부드러운 회색
      main: grey[900],
    },
    background: {
      // 배경: 아주 밝은 회색으로 깊이감을 줍니다.
      default: "#f4f6f8",
      paper: "#ffffff",
    },
  },
  typography: {
    // 폰트: 시스템 폰트와 Inter를 사용합니다.
    fontFamily: ['"Inter"', "sans-serif"].join(","),
  },
  components: {
    // BottomNavigationAction의 폰트 크기를 약간 조정합니다.
    MuiBottomNavigationAction: {
      styleOverrides: {
        label: {
          fontSize: "0.75rem",
        },
      },
    },
  },
});

export default theme;
