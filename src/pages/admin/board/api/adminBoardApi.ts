import axios from "../../../common/axios";

export type BoardType = "NOTICE" | "REVIEW";
export type BoardSearchType =
  | "TITLE_CONTENT"
  | "TITLE"
  | "CONTENT"
  | "AUTHOR"
  | "COMMENT";
export type CommentSortType = "latest" | "created";
export type AdminBoardStatusFilter =
  | "ALL"
  | "NOTICE"
  | "REVIEW"
  | "HIDDEN"
  | "REPORTED";
export type ReportStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type ReportActionType = "HIDE_BOARD" | "DELETE_COMMENT";

export interface AdminBoardListItem {
  id: number;
  boardType: BoardType;
  title: string;
  authorId?: number;
  authorNickname: string;
  viewCount: number;
  recommendCount: number;
  createdAt?: string;
  commentCount: number;
  hasImage?: boolean;
  hasVideo?: boolean;
  hidden?: boolean;
  reportCount?: number;
}

export interface AdminBoardPageResponse {
  notices: AdminBoardListItem[];
  contents: AdminBoardListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminBoardDetail {
  id: number;
  boardType: BoardType | string;
  title: string;
  content: string;
  contentHtml?: string;
  contentDelta?: string;
  authorId?: number;
  authorNickname?: string;
  createdAt?: string;
  viewCount: number;
  recommendCount: number;
  commentCount: number;
  imageUrl?: string | null;
  hidden?: boolean;
  reportCount?: number;
}

export interface AdminCommentNode {
  id: number;
  authorId?: number;
  userId?: number;
  authorNickname?: string;
  content: string;
  deleted?: boolean;
  createdAt?: string;
  children?: AdminCommentNode[];
}

export interface AdminBoardReport {
  id: number;
  boardId: number;
  boardTitle?: string;
  commentId?: number | null;
  commentContent?: string | null;
  reporterId: number;
  reporterNickname?: string;
  reason: string;
  targetType: "BOARD" | "COMMENT";
  status: ReportStatus;
  actionType?: ReportActionType | null;
  processedBy?: number | null;
  processedAt?: string | null;
  processNote?: string | null;
  createdAt?: string;
}

export interface AdminReportPageResponse {
  content: AdminBoardReport[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ValidationErrorField {
  field: string;
  messages: string[];
}

export interface ValidationErrorPayload {
  code?: string;
  message?: string;
  fields?: ValidationErrorField[];
}

export class AdminEndpointUnsupportedError extends Error {
  constructor(message = "ADMIN_ENDPOINT_NOT_READY") {
    super(message);
    this.name = "AdminEndpointUnsupportedError";
  }
}

export const ADMIN_BOARD_API = "/api/boards";

export const ADMIN_BOARD_ENDPOINTS = {
  list: ADMIN_BOARD_API,
  create: ADMIN_BOARD_API,
  detail: (id: string | number) => `${ADMIN_BOARD_API}/${id}`,
  update: (id: string | number) => `${ADMIN_BOARD_API}/${id}`,
  remove: (id: string | number) => `${ADMIN_BOARD_API}/${id}`,
  recommendations: (id: string | number) =>
    `${ADMIN_BOARD_API}/${id}/recommendations`,
  comments: (id: string | number) => `${ADMIN_BOARD_API}/${id}/comments`,
  comment: (id: string | number, commentId: string | number) =>
    `${ADMIN_BOARD_API}/${id}/comments/${commentId}`,
  imagePresignedUrl: `${ADMIN_BOARD_API}/images/presigned-url`,
  hide: (id: string | number) => `/api/admin/boards/${id}/hide`,
  restore: (id: string | number) => `/api/admin/boards/${id}/restore`,
  pin: (id: string | number) => `/api/admin/boards/${id}/pin`,
  unpin: (id: string | number) => `/api/admin/boards/${id}/unpin`,
  sanction: (userId: string | number) => `/api/admin/users/${userId}/sanctions`,
  reports: "/api/admin/boards/reports",
  report: (reportId: string | number) => `/api/admin/boards/reports/${reportId}`,
} as const;

const normalizeBoard = (board: AdminBoardListItem): AdminBoardListItem => ({
  ...board,
  hidden: Boolean(board.hidden),
  reportCount: Number(board.reportCount ?? 0),
  hasImage: Boolean(board.hasImage),
  hasVideo: Boolean(board.hasVideo),
});

const normalizePageResponse = (
  payload: Partial<AdminBoardPageResponse>,
  defaultSize: number,
): AdminBoardPageResponse => ({
  notices: (payload.notices ?? []).map(normalizeBoard),
  contents: (payload.contents ?? []).map(normalizeBoard),
  page: Number(payload.page ?? 0),
  size: Number(payload.size ?? defaultSize),
  totalElements: Number(payload.totalElements ?? 0),
  totalPages: Number(payload.totalPages ?? 0),
  last: Boolean(payload.last),
});

const throwIfUnsupported = (error: unknown): never => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 404 || status === 405) {
    throw new AdminEndpointUnsupportedError();
  }
  throw error as Error;
};

const getStatus = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status;

const callFirstSuccessPatch = async (paths: string[]) => {
  let lastError: unknown;

  for (const path of paths) {
    try {
      return await axios.patch(path);
    } catch (error: unknown) {
      const status = getStatus(error);
      if (status === 404 || status === 405) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  return throwIfUnsupported(lastError);
};

export const isAdminEndpointUnsupported = (error: unknown): boolean =>
  error instanceof AdminEndpointUnsupportedError;

export const fetchAdminBoards = async (params: {
  page: number;
  size: number;
  type?: BoardType;
  keyword?: string;
  searchType?: BoardSearchType;
}): Promise<AdminBoardPageResponse> => {
  const res = await axios.get(ADMIN_BOARD_ENDPOINTS.list, { params });
  const data = (res.data?.data ?? {}) as Partial<AdminBoardPageResponse>;
  return normalizePageResponse(data, params.size);
};

const normalizeReportPageResponse = (
  payload: Partial<AdminReportPageResponse>,
  defaultSize: number,
): AdminReportPageResponse => ({
  content: (payload.content ?? []).map((item) => ({
    ...item,
    status: item.status ?? "PENDING",
    targetType: item.targetType ?? "BOARD",
  })) as AdminBoardReport[],
  page: Number(payload.page ?? 0),
  size: Number(payload.size ?? defaultSize),
  totalElements: Number(payload.totalElements ?? 0),
  totalPages: Number(payload.totalPages ?? 0),
  last: Boolean(payload.last),
});

export const fetchAdminReports = async (params: {
  page: number;
  size: number;
  status?: ReportStatus;
}): Promise<AdminReportPageResponse> => {
  const res = await axios.get(ADMIN_BOARD_ENDPOINTS.reports, { params });
  const data = (res.data?.data ?? {}) as Partial<AdminReportPageResponse>;
  return normalizeReportPageResponse(data, params.size);
};

export const processAdminReport = async (
  reportId: number,
  payload: {
    status: ReportStatus;
    action?: ReportActionType;
    note?: string;
  },
) => {
  return axios.patch(ADMIN_BOARD_ENDPOINTS.report(reportId), payload);
};

export const fetchAdminBoardDetail = async (
  id: string | number,
): Promise<AdminBoardDetail> => {
  const res = await axios.get(ADMIN_BOARD_ENDPOINTS.detail(id));
  const data = (res.data?.data ?? {}) as AdminBoardDetail;
  return {
    ...data,
    hidden: Boolean(data.hidden),
    reportCount: Number(data.reportCount ?? 0),
  };
};

export const createAdminBoard = async (payload: {
  title: string;
  content: string;
  boardType: BoardType;
  contentDelta?: string;
  contentHtml?: string;
  hidden?: boolean;
}) => axios.post(ADMIN_BOARD_ENDPOINTS.create, payload);

export const updateAdminBoard = async (
  id: string | number,
  payload: {
    title: string;
    content: string;
    boardType: BoardType;
    contentDelta?: string;
    contentHtml?: string;
  },
) => axios.put(ADMIN_BOARD_ENDPOINTS.update(id), payload);

export const deleteAdminBoard = async (id: string | number) =>
  axios.delete(ADMIN_BOARD_ENDPOINTS.remove(id));

export const fetchAdminComments = async (
  boardId: string | number,
  sort: CommentSortType,
): Promise<AdminCommentNode[]> => {
  const res = await axios.get(ADMIN_BOARD_ENDPOINTS.comments(boardId), {
    params: { sort },
  });
  return (res.data?.data ?? []) as AdminCommentNode[];
};

export const createAdminComment = async (
  boardId: string | number,
  payload: { content: string; parentId?: number },
) => axios.post(ADMIN_BOARD_ENDPOINTS.comments(boardId), payload);

export const updateAdminComment = async (
  boardId: string | number,
  commentId: number,
  payload: { content: string },
) => axios.put(ADMIN_BOARD_ENDPOINTS.comment(boardId, commentId), payload);

export const deleteAdminComment = async (
  boardId: string | number,
  commentId: number,
) => axios.delete(ADMIN_BOARD_ENDPOINTS.comment(boardId, commentId));

export const hideAdminBoard = async (id: string | number) => {
  return callFirstSuccessPatch([
    ADMIN_BOARD_ENDPOINTS.hide(id),
    `/api/admin/board/${id}/hide`,
    `/api/boards/${id}/hide`,
  ]);
};

export const restoreAdminBoard = async (id: string | number) => {
  return callFirstSuccessPatch([
    ADMIN_BOARD_ENDPOINTS.restore(id),
    `/api/admin/board/${id}/restore`,
    `/api/boards/${id}/restore`,
  ]);
};

export const pinAdminBoard = async (id: string | number) => {
  return callFirstSuccessPatch([
    ADMIN_BOARD_ENDPOINTS.pin(id),
    `/api/admin/board/${id}/pin`,
    `/api/boards/${id}/pin`,
  ]);
};

export const unpinAdminBoard = async (id: string | number) => {
  try {
    return await axios.patch(ADMIN_BOARD_ENDPOINTS.unpin(id));
  } catch (error: unknown) {
    return throwIfUnsupported(error);
  }
};

export const moveAuthorToSanction = async (userId: number) => {
  try {
    return await axios.post(ADMIN_BOARD_ENDPOINTS.sanction(userId), {
      reason: "관리자 게시판 제재 이동",
    });
  } catch (error: unknown) {
    return throwIfUnsupported(error);
  }
};
