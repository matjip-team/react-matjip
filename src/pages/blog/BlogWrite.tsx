import { useEffect, useState } from "react";
import { useFormError } from "../common/utils/useFormError.ts"; //폼 에러 처리 공통 훅
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import type { ApiResponse } from "../common/types/api.ts";
import CustomizedDialogs from "../common/component/dialog.tsx";
import axios from "../common/axios.ts"; //axios 인스턴스 공통
import { useAuth } from "@/pages/common/context/useAuth.ts"; //로그인 사용자정보 공통
import { unwrapData } from "../common/utils/helperUtil.ts";

export interface TestResponse {
  email: string;
  nickname: string;
  bio?: string;
}

export default function BlogWrite() {
  const { user } = useAuth(); //로그인 사용자정보 공통

  console.log("BlogWrite user:", user);

  /**
   * 공통 포함 시작 ======================================
   */
  // 1. 폼 에러 처리 훅
  const {
    globalError,
    fieldErrors,
    setFieldErrors,
    handleApiError,
    resetErrors,
  } = useFormError<TestResponse>();

  // 성공 다이얼로그
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
  });

  // 2. 폼 변경 처리 공통
  const handleChange =
    (key: keyof TestResponse) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  /**
   * 공통 포함 끝 ====================================================
   */

  const EMPTY_FORM: TestResponse = {
    email: "",
    nickname: "",
    bio: "",
  };

  const [form, setForm] = useState<TestResponse>({
    ...EMPTY_FORM,
  });

  // 데이터 가지고 오기
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get<ApiResponse<TestResponse>>(
          "/api/mypage/profile",
        );

        const rtn = unwrapData(res.data);
        setForm((prev) => ({ ...prev, ...rtn }));
      } catch (err) {
        handleApiError(err);
      }
    };

    fetchProfile();
  }, []);

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 에러 초기화
    resetErrors(); // <== 폼에러 초기화 공통

    // 로직 처리
    try {
      const response = await axios.put<ApiResponse<TestResponse>>(
        "/api/mypage/profile",
        form,
      );

      unwrapData(response.data);
      //성공 했을때 처리 공통
      if (response.data?.success) {
        setModal({
          open: true,
          title: "성공!",
          message: response.data.message || "",
        });
      } else {
        throw new Error(response.data?.error?.message || "");
      }
    } catch (err) {
      // HTTP 400/500 등 에러 처리
      handleApiError(err); // <== 공통 훅으로 처리
    }
  };

  return (
    <>
      <Paper sx={{ p: 3, maxWidth: 500, mx: "auto", mt: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6">테스트 샘플</Typography>
          {/* 글로벌 오류 메세지 표시 공통 */}
          {globalError && <Alert severity="error">{globalError}</Alert>}

          <TextField label="이메일" value={form.email} disabled fullWidth />

          <TextField
            label="닉네임"
            value={form.nickname}
            onChange={handleChange("nickname")}
            error={!!fieldErrors.nickname}
            helperText={fieldErrors.nickname}
            required
          />
          <TextField
            label="자기소개"
            value={form.bio || ""}
            onChange={handleChange("bio")}
            error={!!fieldErrors.bio}
            helperText={fieldErrors.bio}
            required
          />
          <Button variant="contained" onClick={handleSubmit}>
            저장
          </Button>
        </Box>
      </Paper>
      {/* 공통 다이얼로그 */}
      <CustomizedDialogs
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.title}
        message={modal.message}
      />
    </>
  );
}
