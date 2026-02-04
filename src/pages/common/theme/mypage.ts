// theme.ts
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiFormLabel: {
      styleOverrides: {
        asterisk: {
          color: "#d32f2f", // MUI error.red
        },
      },
    },
  },
});

export default theme;
