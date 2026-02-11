import * as React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import RestoreIcon from "@mui/icons-material/Restore";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArchiveIcon from "@mui/icons-material/Archive";
import ReviewList from "./components/ReviewsList";
import LikeList from "./components/LikeList";
import ProfileEdit from "./components/ProfileEdit";
import { getProfile } from "./api/mypageApi";
import type { ProfileResponse } from "./types/profile";
import { unwrapData } from "../common/utils/helperUtil";
import { ThemeProvider } from "@mui/material/styles";
import myPageTheme from "../common/theme/mypage";

export default function MyPage() {
  const [value, setValue] = React.useState(0);
  const [profile, setProfile] = React.useState<ProfileResponse | null>(null);

  //const [profile, setProfile] = React.useState<ProfileResponse | null>(null);

  // 메뉴 선택 시 데이터 가져오기
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        if (value === 0) {
          //
        } else if (value === 1) {
          //
        } else if (value === 2) {
          const res = await getProfile();
          console.log("Profile 부모 렌더");
          const profileData = unwrapData(res.data);
          setProfile(profileData);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [value]);

  const renderContent = () => {
    switch (value) {
      case 0:
        return <LikeList />;
      case 1:
        return (
          <Box sx={{ pb: 7 }}>
            <CssBaseline />
            <ReviewList />
          </Box>
        );
      case 2:
        if (!profile) return <div>loading...</div>;
        return <ProfileEdit data={profile} />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={myPageTheme}>
      <Box sx={{ pb: 7, maxWidth: 1200, mx: "auto" }}>
        <CssBaseline />
        {/* 콘텐츠 영역 */}
        {/* <Box
        sx={{
          //maxWidth: 1000, // 👈 여기서 가로폭 제한
          // minWidth: "auto", // 👈 최소 폭 고정
          mx: "auto", // 가운데 정렬
          px: 2, // 좌우 여백 (모바일)
        }}
      > */}
        {renderContent()}
        {/* </Box> */}

        <Paper
          sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000 }}
          elevation={3}
        >
          <BottomNavigation
            value={value}
            onChange={(_e, newValue) => setValue(newValue)}
            showLabels
          >
            <BottomNavigationAction label="찜한식당" icon={<RestoreIcon />} />
            <BottomNavigationAction
              label="내가 쓴 리뷰"
              icon={<FavoriteIcon />}
            />
            <BottomNavigationAction
              label="내 정보 수정"
              icon={<ArchiveIcon />}
            />
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
