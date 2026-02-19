import axios from "../../common/axios";
import rawAxios from "axios";

interface PresignedUploadPayload {
  uploadUrl: string;
  fileKey: string;
}

interface PresignedUploadResponse {
  data?: PresignedUploadPayload;
}

const PRESIGNED_URL_ENDPOINT = "/api/restaurants/licenses/presigned-url";

const unwrapResponse = (payload: unknown): PresignedUploadPayload => {
  const body = payload as PresignedUploadResponse;
  const data = body?.data;

  if (!data?.uploadUrl || !data?.fileKey) {
    throw new Error("Invalid presigned upload response");
  }

  return data;
};

export const uploadBusinessLicenseFile = async (file: File): Promise<string> => {
  const contentType = file.type || "application/pdf";

  const presignedResponse = await axios.post(PRESIGNED_URL_ENDPOINT, {
    fileName: file.name,
    contentType,
  });

  const { uploadUrl, fileKey } = unwrapResponse(presignedResponse.data);

  await rawAxios.put(uploadUrl, file, {
    headers: {
      "Content-Type": contentType,
    },
  });

  return fileKey;
};
