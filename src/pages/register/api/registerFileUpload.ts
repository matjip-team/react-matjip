import axios from "../../common/axios";
import rawAxios from "axios";

interface PresignedLicenseUploadPayload {
  uploadUrl: string;
  fileKey: string;
}

interface PresignedImageUploadPayload {
  uploadUrl: string;
  fileUrl?: string;
  fileKey?: string;
}

interface PresignedUploadResponse<T> {
  data?: T;
}

const PRESIGNED_URL_ENDPOINT = "/api/spring/restaurants/licenses/presigned-url";
const LICENSE_VIEW_URL_ENDPOINT = "/api/spring/restaurants/licenses/view-url";
const RESTAURANT_IMAGE_PRESIGNED_URL_ENDPOINT = "/api/spring/restaurants/images/presigned-url";
const BOARD_IMAGE_PRESIGNED_URL_ENDPOINT = "/api/spring/boards/images/presigned-url";

const getHttpStatus = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status;

const unwrapLicenseResponse = (payload: unknown): PresignedLicenseUploadPayload => {
  const body = payload as PresignedUploadResponse<PresignedLicenseUploadPayload>;
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

  const { uploadUrl, fileKey } = unwrapLicenseResponse(presignedResponse.data);

  await rawAxios.put(uploadUrl, file, {
    headers: {
      "Content-Type": contentType,
    },
  });

  return fileKey;
};

export const getBusinessLicenseFileViewUrl = async (fileKey: string): Promise<string> => {
  const normalizedFileKey = (() => {
    const raw = (fileKey ?? "").trim();
    if (!raw) return raw;
    if (/^https?:\/\//i.test(raw)) {
      try {
        const url = new URL(raw);
        return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
      } catch {
        return raw;
      }
    }
    return raw;
  })();

  const response = await axios.post(LICENSE_VIEW_URL_ENDPOINT, { fileKey: normalizedFileKey });
  const body = response.data as { data?: string; message?: string | null } | undefined;
  const url = body?.data ?? (typeof body?.message === "string" ? body.message : null);
  if (!url) {
    throw new Error("LICENSE_VIEW_URL_NOT_FOUND");
  }
  return url;
};

const unwrapImageResponse = (payload: unknown): { uploadUrl: string; assetUrl: string } => {
  const body = payload as PresignedUploadResponse<PresignedImageUploadPayload>;
  const data = body?.data;

  if (!data?.uploadUrl) {
    throw new Error("Invalid presigned image upload response");
  }

  const assetUrl =
    data.fileUrl ??
    (data.uploadUrl ? data.uploadUrl.split("?")[0] : undefined) ??
    data.fileKey;
  if (!assetUrl) {
    throw new Error("Invalid presigned image upload response");
  }

  return {
    uploadUrl: data.uploadUrl,
    assetUrl,
  };
};

export const uploadRestaurantRepresentativeImage = async (file: File): Promise<string> => {
  const contentType = file.type || "image/png";

  let presignedResponse;
  try {
    presignedResponse = await axios.post(RESTAURANT_IMAGE_PRESIGNED_URL_ENDPOINT, {
      fileName: file.name,
      contentType,
    });
  } catch (error: unknown) {
    const status = getHttpStatus(error);
    if (status !== 404 && status !== 405 && status !== 500) {
      throw error;
    }

    // Fallback: 공용 이미지 presigned endpoint
    presignedResponse = await axios.post(BOARD_IMAGE_PRESIGNED_URL_ENDPOINT, {
      fileName: file.name,
      contentType,
    });
  }

  const { uploadUrl, assetUrl } = unwrapImageResponse(presignedResponse.data);

  await rawAxios.put(uploadUrl, file, {
    headers: {
      "Content-Type": contentType,
    },
  });

  return assetUrl;
};
