import { createTheme } from "@mui/material/styles";

export const blogTheme = createTheme({
  components: {
    MuiButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          "&:focus": {
            outline: "none",
          },
          "&.Mui-focusVisible": {
            outline: "none",
            boxShadow: "none",
          },
        },
      },
    },
  },
});
