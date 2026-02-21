import * as React from "react";
import { useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
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

const TAB_TITLES: Record<number, { title: string; subtitle: string }> = {
  0: { title: "찜한 식당", subtitle: "찜해둔 맛집을 확인해보세요" },
  1: { title: "내가 쓴 리뷰", subtitle: "작성한 리뷰를 관리할 수 있습니다" },
  2: { title: "맛집 등록", subtitle: "새 맛집을 등록해보세요" },
  3: { title: "내 신청 내역", subtitle: "맛집 등록 신청 현황을 확인합니다" },
  4: { title: "내 정보", subtitle: "프로필을 확인하고 수정할 수 있습니다" },
};

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
        return <RegisterPage />;
      case 3:
        return <MyRestaurantRequestListPage />;
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

  const currentTab = TAB_TITLES[value as keyof typeof TAB_TITLES] ?? {
    title: "마이페이지",
    subtitle: "",
  };

  return (
    <ThemeProvider theme={myPageTheme}>
      <Box
        sx={{
          pb: 10,
          width: "100%",
          maxWidth: 1160,
          mx: "auto",
          py: 5,
          px: { xs: 2, sm: 3 },
        }}
      >

        {/* 페이지 타이틀 */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: "-0.02em",
              mb: 0.5,
            }}
          >
            {currentTab.title}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#64748b" }}>
            {currentTab.subtitle}
          </Typography>
        </Box>

        {/* 콘텐츠 영역 */}
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
