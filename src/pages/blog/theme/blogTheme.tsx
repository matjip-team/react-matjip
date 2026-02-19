import { createTheme } from "@mui/material/styles";

export const blogTheme = createTheme({
  components: {
    MuiButton: {
      defaultProps: {
        disableRipple: true, // 💥 물결 제거
      },
      styleOverrides: {
        root: {
          textTransform: "none", 
          "&:focus": {
            outline: "none",
          },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "none", // ✅ 검정 포커스 제거
          },
        },
      },
    },
  },
});

