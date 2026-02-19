import axios from "../../common/axios";
import rawAxios from "axios";

interface PresignedUploadPayload {
  uploadUrl: string;
  fileUrl: string;
}

interface PresignedUploadResponse {
  data?: PresignedUploadPayload;
}

const PRESIGNED_URL_ENDPOINT = "/api/mypage/profile-images/presigned-url";

const unwrapResponse = (payload: unknown): PresignedUploadPayload => {
  const body = payload as PresignedUploadResponse;
  const data = body?.data;

  if (!data?.uploadUrl || !data?.fileUrl) {
    throw new Error("Invalid presigned upload response");
  }

  return data;
};

export const uploadProfileImage = async (file: File): Promise<string> => {
  const contentType = file.type || "image/png";

  const presignedResponse = await axios.post(PRESIGNED_URL_ENDPOINT, {
    fileName: file.name,
    contentType,
  });

  const { uploadUrl, fileUrl } = unwrapResponse(presignedResponse.data);

  await rawAxios.put(uploadUrl, file, {
    headers: {
      "Content-Type": contentType,
    },
  });

  return fileUrl;
};
