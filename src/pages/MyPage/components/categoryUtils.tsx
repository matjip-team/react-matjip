import React, { type JSX } from "react";
import RamenDiningIcon from "@mui/icons-material/RamenDining";
import LocalPizzaIcon from "@mui/icons-material/LocalPizza";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import type { Category } from "../types/catetory";
import { Box } from "@mui/material";

export interface CategoryDisplay {
    icon: JSX.Element;
    color: string;
}

// 카테고리별 아이콘 + 색상 매핑
const categoryMap: { keywords: string[]; icon: JSX.Element; color: string }[] = [
    { keywords: ["일식"], icon: <RamenDiningIcon fontSize="small" />, color: "#FFB74D" },
    { keywords: ["한식"], icon: <RestaurantIcon fontSize="small" />, color: "#81C784" },
    { keywords: ["양식"], icon: <LocalPizzaIcon fontSize="small" />, color: "#64B5F6" },
    { keywords: ["분식"], icon: <FastfoodIcon fontSize="small" />, color: "#E57373" },
    { keywords: ["중식"], icon: <FastfoodIcon fontSize="small" />, color: "#E57373" },
    { keywords: ["세계음식", "일중"], icon: <FastfoodIcon fontSize="small" />, color: "#E57373" },
    { keywords: [], icon: <FastfoodIcon fontSize="small" />, color: "#BDBDBD" }, // 디폴트
];

// 실제 렌더링할 때
const getCategoryDisplay = (catName: string) => {
    const category = categoryMap.find((c) =>
        c.keywords.some((kw) => catName.includes(kw))
    );
    return category ?? categoryMap[categoryMap.length - 1];
};

// 실제 렌더링할 때
export const renderCategories = (categories: Category[]) => {
    const catsToRender = categories.length > 0 ? categories : [{ id: "default", name: "기타" }];
    return catsToRender.map((cat) => {
        const display = getCategoryDisplay(cat.name);
        return (
            <Box
                key={cat.id}
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.2,
                    px: 0.5,
                    py: 0.2,
                    borderRadius: 0.5,
                    bgcolor: display.color,
                    color: "white",
                    fontWeight: 500,
                    fontSize: "0.65rem",
                }}
            >
                {React.cloneElement(display.icon, { fontSize: "inherit" })}
                {cat.name}
            </Box>
        );
    });
};
