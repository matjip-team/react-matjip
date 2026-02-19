import axios from "../../common/axios";
import rawAxios from "axios";

interface PresignedUploadPayload {
  uploadUrl: string;
  fileUrl: string;
}

interface PresignedUploadResponse {
  data?: PresignedUploadPayload;
}

type UploadStep = "presign" | "s3-put";

interface UploadMarkedError {
  uploadStep?: UploadStep;
}

const PRESIGNED_URL_ENDPOINT = "/api/blogs/images/presigned-url";

const unwrapResponse = (payload: unknown): PresignedUploadPayload => {
  const body = payload as PresignedUploadResponse;
  const data = body?.data;

  if (!data?.uploadUrl || !data?.fileUrl) {
    throw new Error("Invalid presigned upload response");
  }

  return data;
};

export const uploadBlogImage = async (file: File): Promise<string> => {
  const contentType = file.type || "image/png";

  let presignedResponse;
  try {
    presignedResponse = await axios.post(PRESIGNED_URL_ENDPOINT, {
      fileName: file.name,
      contentType,
    });
  } catch (error: unknown) {
    (error as UploadMarkedError).uploadStep = "presign";
    throw error;
  }

  const { uploadUrl, fileUrl } = unwrapResponse(presignedResponse.data);

  try {
    await rawAxios.put(uploadUrl, file, {
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error: unknown) {
    (error as UploadMarkedError).uploadStep = "s3-put";
    throw error;
  }

  return fileUrl;
};

