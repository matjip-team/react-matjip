// 이 파일은 설정용 파일입니다.
// http://localhost:9000

const API_HOST = "43.202.121.6"; // 호스트 컴퓨터 이름(127.0.0.1)
// const API_PORT = "8081"; // 스프링 부트 포트

// export 키워드를 적어 주어야 외부에서 접근 가능합니다.
// export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
export const API_BASE_URL = `http://${API_HOST}`;
/** 스프링 백엔드 API prefix (프록시/라우팅 시 사용) */
export const API_SPRING_PREFIX = "/api/spring";
