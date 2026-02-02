import * as React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import RestoreIcon from "@mui/icons-material/Restore";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArchiveIcon from "@mui/icons-material/Archive";
import { type Review } from "./types/review";
// import FavoritesList, { Favorite } from "./FavoritesList";

// import ProfileEdit from "./ProfileEdit";

import axios from "../common/axios";
import ReviewsList from "./components/ReviewsList";
import RecommendationsList from "./components/RecommendationsList";
import { type Recommendation } from "./types/recommendation";
import ProfileEdit from "./ProfileEdit";

export default function FixedBottomNavigation() {
  const [value, setValue] = React.useState(0);
  const [recommendation, setRecommendation] = React.useState<Recommendation[]>(
    [],
  );
  const [reviews, setReviews] = React.useState<Review[]>([]);

  // 메뉴 선택 시 데이터 가져오기
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        if (value === 0) {
          // const res = await axios.get<Favorite[]>("/api/mypage/favorites");
          const res = await axios.get<Recommendation[]>("/api/mypage/reviews");
          setRecommendation(res.data);
        } else if (value === 1) {
          const res = await axios.get<Review[]>("/api/mypage/reviews");
          setReviews(res.data);
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
        return <RecommendationsList data={recommendation} />; //<FavoritesList data={favorites} />;
      case 1:
        return (
          <Box sx={{ pb: 7 }}>
            <CssBaseline />
            <ReviewsList data={reviews} />
          </Box>
        );
      case 2:
        return <ProfileEdit />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ pb: 7 }}>
      <CssBaseline />
      {renderContent()}
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          value={value}
          onChange={(e, newValue) => setValue(newValue)}
          showLabels
        >
          <BottomNavigationAction label="찜한식당" icon={<RestoreIcon />} />
          <BottomNavigationAction
            label="내가 쓴 리뷰"
            icon={<FavoriteIcon />}
          />
          <BottomNavigationAction label="내 정보 수정" icon={<ArchiveIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
