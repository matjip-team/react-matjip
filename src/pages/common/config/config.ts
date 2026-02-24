// 이 파일은 설정용 파일입니다.
// 로컬: npm run dev 시 localhost:8081, 운영 빌드 시 43.202.121.6

/** 로컬 개발 환경 여부 (Vite: dev = true, build = false) */
export const IS_LOCAL = false;

/** 운영(프로덕션) 환경 여부 */
export const IS_PRODUCTION = true;

const LOCAL_API = "http://localhost:8081";
const AI_API = "http://localhost:8000"; // Python AI 추천 서버 (로컬)
const PRODUCTION_API = "http://43.202.121.6";

export const API_BASE_URL = IS_LOCAL ? LOCAL_API : PRODUCTION_API;
/** AI 추천 API: 로컬 = AI_API, 운영 = PRODUCTION_API */
export const AI_RECOMMEND_BASE_URL = IS_LOCAL ? AI_API : PRODUCTION_API;
/** 스프링 백엔드 API prefix (프록시/라우팅 시 사용) */
export const API_SPRING_PREFIX = "/api/spring";
