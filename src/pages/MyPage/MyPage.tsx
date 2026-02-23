import * as React from "react";
import { useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PreviewIcon from "@mui/icons-material/Preview";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import ReviewList from "./components/ReviewsList";
import LikeList from "./components/LikeList";
import ProfileEdit from "./components/ProfileEdit";
import ProfileInfo from "./components/ProfileInfo";
import { getProfile } from "./api/mypageApi";
import type { ProfileResponse } from "./types/profile";
import { unwrapData } from "../common/utils/helperUtil";
import { ThemeProvider } from "@mui/material/styles";
import myPageTheme from "../common/theme/mypage";
import RegisterPage from "../register/RegisterPage";
import MyRestaurantRequestListPage from "../register/MyRestaurantRequestListPage";

export default function MyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [value, setValue] = React.useState(() =>
    tabParam !== null ? Math.min(Math.max(0, Number(tabParam) || 0), 4) : 0,
  );

  // URL tab 파라미터 변경 시 동기화
  React.useEffect(() => {
    if (tabParam !== null) {
      setValue(Math.min(Math.max(0, Number(tabParam) || 0), 4));
    }
  }, [tabParam]);
  const [profile, setProfile] = React.useState<ProfileResponse | null>(null);
  const [profileViewMode, setProfileViewMode] = React.useState<"info" | "edit">("info");

  //const [profile, setProfile] = React.useState<ProfileResponse | null>(null);

  // 메뉴 선택 시 데이터 가져오기
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        if (value === 0) {
          //
        } else if (value === 1) {
          //
        } else if (value === 4) {
          const res = await getProfile();
          const profileData = unwrapData(res.data);
          setProfile(profileData);
          setProfileViewMode("info");
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
        return <ReviewList />;

      case 2:
        return <RegisterPage embedded />;
      case 3:
        return <MyRestaurantRequestListPage embedded />;
      case 4:
        if (!profile) {
          return (
            <Box
              sx={{
                py: 8,
                textAlign: "center",
                color: "#64748b",
                fontSize: 15,
              }}
            >
              로딩 중...
            </Box>
          );
        }
        if (profileViewMode === "edit") {
          return (
            <ProfileEdit
              data={profile}
              onBack={() => setProfileViewMode("info")}
              onSaved={async () => {
                const res = await getProfile();
                const profileData = unwrapData(res.data);
                setProfile(profileData);
                setProfileViewMode("info");
              }}
            />
          );
        }
        return (
          <ProfileInfo
            data={profile}
            onEdit={() => setProfileViewMode("edit")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={myPageTheme}>
      <Box
        sx={{
          pb: 10,
          width: "100%",
          maxWidth: 1100,
          mx: "auto",
          py: 5,
          px: { xs: 2, sm: 3 },
        }}
      >
        {renderContent()}

        {/* 하단 네비게이션 */}
        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            borderTop: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            borderRadius: 0,
          }}
        >
          <BottomNavigation
            value={value}
            onChange={(_e, newValue) => {
              setValue(newValue);
              setSearchParams({ tab: String(newValue) }, { replace: true });
            }}
            showLabels
            sx={{
              bgcolor: "#fff",
              "& .MuiBottomNavigationAction-root": {
                minWidth: 64,
              },
              "& .Mui-selected": {
                color: "#ff6b00",
              },
            }}
          >
            <BottomNavigationAction label="찜한식당" icon={<FavoriteIcon />} />
            <BottomNavigationAction
              label="내가 쓴 리뷰"
              icon={<PreviewIcon />}
            />
            <BottomNavigationAction
              label="맛집등록"
              icon={<RestaurantIcon />}
            />
            <BottomNavigationAction
              label="내 신청내역"
              icon={<ContentPasteSearchIcon />}
            />
            <BottomNavigationAction
              label="내 정보"
              icon={<AssignmentIndIcon />}
            />
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
