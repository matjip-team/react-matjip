import { createTheme } from "@mui/material/styles";

export const blogTheme = createTheme({
  components: {
    MuiButton: {
      defaultProps: {
        disableRipple: true, // 💥 물결 제거
      },
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            fontSize: "20px",
          },
          "& .MuiInputLabel-root": {
            fontSize: "12px",
          },
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
