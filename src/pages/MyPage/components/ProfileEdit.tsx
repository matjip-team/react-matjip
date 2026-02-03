import * as React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from "@mui/material";

import AvatarUpload from "./AvatarUpload";
import { type ProfileResponse } from "../types/profile";
import { useState } from "react";
import { updateProfile } from "../api/mypageApi";
import { useNavigate } from "react-router-dom";
import { handleApiError } from "../../common/utils/handleApiError";

// interface ProfileResponseForm extends ProfileResponse {
//   password: string | null,
//   passwordConfirm: string | null,
//   profileImage: File | null
// }

// type FieldErrors = Partial<Record<keyof ProfileResponseForm, string>>;

// interface Props {
//   data: ProfileResponse;
// }
export default function ProfileEdit({ data }: Props) {

  // const EMPTY_FORM: ProfileResponseForm = {
  //   email: "",
  //   nickname: "",
  //   name: "",
  //   bio: "",
  //   profileImageUrl: "",
  //   password: "",
  //   passwordConfirm: "",
  //   profileImage: null,
  // };

  console.log("여기 몇번따는거야");

React.useEffect(() => {
  console.log("ProfileEdit MOUNT");
  return () => {
    console.log("ProfileEdit UNMOUNT");
  }
}, []);

//   const [form, setForm] = useState<ProfileResponseForm>(EMPTY_FORM);

//   const navigate = useNavigate();

//   //const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
//   const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
//   const [globalError, setGlobalError] = useState<string | null>(null);
//  // const [previewUrl, setPreviewUrl] = useState<string | undefined>(form?.profileImageUrl);

//   // React.useEffect(() => {
//   //   setForm(prev => ({
//   //     ...prev,
//   //     ...data,
//   //   }));
//   // }, [data]);
//   //const [loading, setLoading] = useState(false);

//   const handleChange =
//     (key: keyof ProfileResponseForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
//       setForm({ ...form, [key]: e.target.value });
//       setFieldErrors({ ...fieldErrors, [key]: undefined });
//     };

//   const handleFileChange = (file?: File) => {
//     if (file) {
//       setForm({ ...form, profileImage: file });
//       //setPreviewUrl(URL.createObjectURL(file)); // 미리보기 URL 생성
//     } else {
//       //setPreviewUrl(undefined);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setGlobalError(null);
//     setFieldErrors({});

//     // 클라이언트-side 비밀번호 확인
//     if (form.password !== form.passwordConfirm) {
//       setFieldErrors({ passwordConfirm: "비밀번호가 일치하지 않습니다." });
//       return;
//     }

//     try {
//       //setLoading(true);

//       const formData = new FormData();
//       Object.entries(form).forEach(([key, value]) => {
//         if (value !== null && value !== "") formData.append(key, value);
//       });

//       const response = await updateProfile(formData);

//       // 서버가 HTTP 200이면 success 체크
//       if (response.data?.success) {
//         navigate("/auth/login");
//         return;
//       }

//       // HTTP 200인데 실패인 경우
//       if (!response.data?.success) {
//         throw response.data; // 여기서 그냥 던짐
//       }
//     } catch (err) {
//       // HTTP 400/500 등 에러 처리
//       const { fieldErrors: fe, globalError: ge } =
//       handleApiError<ProfileResponseForm>(err);
//       setFieldErrors(fe);
//       setGlobalError(ge);
//     } finally {
//       //setLoading(false);
//     }
//   };

//   return (
//     <Paper sx={{ p: 3, maxWidth: 500, mx: "auto", mt: 4 }}>
//       <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
//         <Typography variant="h6">회원 정보 수정</Typography>
//         {globalError && <Alert severity="error">{globalError}</Alert>}
//         {/* //<AvatarUpload imageUrl={previewUrl} onChange={handleFileChange} /> */}

//         <TextField label="이메일" value={form.email} disabled fullWidth />

//         <TextField
//           label="비밀번호"
//           type="password"
//           value={form.password}
//           onChange={handleChange("password")}
//           error={!!fieldErrors.password}
//           helperText={fieldErrors.password}
//           required
//         />

//         <TextField
//           label="비밀번호 확인"
//           type="password"
//           value={form.passwordConfirm}
//           onChange={handleChange("passwordConfirm")}
//           error={!!fieldErrors.passwordConfirm}
//           helperText={fieldErrors.passwordConfirm}
//           required
//         />

//         <TextField
//           label="닉네임"
//           value={form.nickname}
//           onChange={handleChange("nickname")}
//           error={!!fieldErrors.nickname}
//           helperText={fieldErrors.nickname}
//           required
//         />

//         <TextField
//           label="자기소개"
//           value={form.bio || ""}
//           onChange={handleChange("bio")}
//           error={!!fieldErrors.bio}
//           helperText={fieldErrors.bio}
//           required
//         />

//         <Button variant="contained" onClick={handleSubmit}>
//           저장
//         </Button>
//       </Box>
//     </Paper>
//   );
}
