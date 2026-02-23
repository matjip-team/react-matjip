#!/usr/bin/env node
/**
 * 맛집 등록 신청 10건 시드 데이터 생성 스크립트
 * - 대표사진 포함
 * - 설명(맛집소개/대표메뉴/추천포인트) 포함
 * - 사업자등록증 임시 파일 업로드 후 신청 등록
 *
 * 실행:
 *   node scripts/seed-restaurant-requests-10-matjip.mjs
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8081";
const LOGIN_EMAIL = process.env.LOGIN_EMAIL ?? "test@naver.com";
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD ?? "12345678";
const S3_PUBLIC_BASE_URL =
  (process.env.S3_PUBLIC_BASE_URL ??
    "https://matjip-board-images-giduon-2026.s3.ap-northeast-2.amazonaws.com").replace(/\/$/, "");

const CATEGORY_OPTIONS = [
  "한식",
  "양식",
  "고기/구이",
  "씨푸드",
  "일중/세계음식",
  "비건",
  "카페/디저트",
];

const REQUESTS = [
  {
    name: "초이다이닝 혜화대학로점",
    address: "서울 종로구 대학로11길 31",
    latitude: 37.58212,
    longitude: 127.00262,
    phone: "02-743-7773",
    categories: ["일중/세계음식", "양식"],
    image: "https://loremflickr.com/1200/800/japanese-food?lock=9101",
    menuImages: [
      "https://loremflickr.com/900/600/sushi?lock=9111",
      "https://loremflickr.com/900/600/pasta?lock=9112",
      "https://loremflickr.com/900/600/tonkatsu?lock=9113",
    ],
    menus: ["연어 후토마끼", "경양식 뼈돈카츠", "초이식 마제소바", "명이페스토 오일파스타"],
    introParagraphs: [
      "초이다이닝 혜화대학로점은 오마카세에서 먹을 수 있었던 후토마끼를 누구나 즐길 수 있도록 대중화한 혜화 대표 맛집입니다.",
      "누구나 맛있게 먹을 수 있는 후토마끼와 다양한 메뉴 구성으로, 여러 명이 방문해도 각자 취향에 맞는 메뉴를 찾을 수 있어 만족도가 높은 매장입니다.",
      "특히 숙성연어를 듬뿍 넣은 연어 후토마끼는 직접 다시마 숙성 과정을 거쳐 재료 간 밸런스를 높여 가장 많이 찾는 시그니처 메뉴입니다.",
      "그 외에도 뼈 등심을 통째로 튀긴 경양식 뼈돈카츠, 특제 백된장 베이스 양념에 칼국수면을 비벼 먹는 초이식 마제소바, 명이나물 페스토를 활용한 명이페스토 오일파스타까지 폭넓은 선택지를 제공합니다.",
      "후토마끼를 중심으로 다양한 퓨전 일식 다이닝 메뉴를 초이다이닝만의 스타일로 재해석해 대학로 파스타 맛집, 마제소바 맛집, 돈카츠 맛집으로도 알려져 있습니다.",
      "본점인 혜화대학로점은 웨이팅 맛집으로 시작해 전국으로 확장 중인 브랜드로 자리잡고 있습니다.",
      "혜화역 3번 출구 도보 3분 거리로 접근성도 좋아 데이트, 모임, 가족 식사, 혼밥 모두 추천드립니다.",
    ],
    recommendationBullets: [
      "혜화 데이트 코스 맛집을 찾는 커플",
      "혜화/대학로에서 신메뉴 경험을 원하는 미식가",
      "어린아이부터 어른까지 함께 방문 가능한 가족 식사 장소",
      "하이볼과 함께 가볍게 혼밥을 즐기고 싶은 방문자",
    ],
  },
  {
    name: "강남 우동연구소",
    address: "서울 강남구 테헤란로 212",
    latitude: 37.50121,
    longitude: 127.0396,
    phone: "02-555-0212",
    categories: ["일중/세계음식"],
    image: "https://loremflickr.com/1200/800/udon?lock=9002",
    menus: ["크림카레우동", "닭튀김", "유부초밥"],
  },
  {
    name: "성수 파스타베이스",
    address: "서울 성동구 아차산로9길 12",
    latitude: 37.54662,
    longitude: 127.05531,
    phone: "02-468-0912",
    categories: ["양식"],
    image: "https://loremflickr.com/1200/800/pasta?lock=9003",
    menus: ["트러플크림파스타", "봉골레", "라자냐"],
  },
  {
    name: "해운대 바다식탁",
    address: "부산 해운대구 해운대해변로 289",
    latitude: 35.15884,
    longitude: 129.16032,
    phone: "051-742-2289",
    categories: ["씨푸드", "한식"],
    image: "https://loremflickr.com/1200/800/seafood?lock=9004",
    menus: ["모둠회", "해물탕", "전복버터구이"],
  },
  {
    name: "잠실 그린테이블",
    address: "서울 송파구 올림픽로35길 124",
    latitude: 37.51497,
    longitude: 127.10243,
    phone: "02-424-5124",
    categories: ["비건", "양식"],
    image: "https://loremflickr.com/1200/800/vegan-food?lock=9005",
    menus: ["비건버거", "병아리콩 샐러드", "오트라떼"],
  },
  {
    name: "전주 한옥 비빔연구소",
    address: "전북 전주시 완산구 전주천동로 20",
    latitude: 35.8135,
    longitude: 127.15388,
    phone: "063-281-0220",
    categories: ["한식"],
    image: "https://loremflickr.com/1200/800/bibimbap?lock=9006",
    menus: ["전주비빔밥", "육회비빔밥", "콩나물국밥"],
  },
  {
    name: "대전 중앙 떡볶이클럽",
    address: "대전 중구 중앙로164번길 35",
    latitude: 36.32794,
    longitude: 127.42626,
    phone: "042-224-1635",
    categories: ["한식", "카페/디저트"],
    image: "https://loremflickr.com/1200/800/tteokbokki?lock=9007",
    menus: ["로제떡볶이", "치즈김밥", "수제어묵"],
  },
  {
    name: "광주 상무 카츠워크",
    address: "광주 서구 상무중앙로 60",
    latitude: 35.15391,
    longitude: 126.85235,
    phone: "062-381-0060",
    categories: ["일중/세계음식"],
    image: "https://loremflickr.com/1200/800/tonkatsu?lock=9008",
    menus: ["등심카츠", "치즈카츠", "냉모밀"],
  },
  {
    name: "수원 행궁 브런치하우스",
    address: "경기 수원시 팔달구 화서문로 47",
    latitude: 37.28643,
    longitude: 127.01466,
    phone: "031-252-0047",
    categories: ["카페/디저트", "양식"],
    image: "https://loremflickr.com/1200/800/brunch?lock=9009",
    menus: ["에그베네딕트", "프렌치토스트", "수프"],
  },
  {
    name: "제주 돌담 흑돼지집",
    address: "제주 제주시 관덕로15길 18",
    latitude: 33.5136,
    longitude: 126.52339,
    phone: "064-758-1518",
    categories: ["고기/구이", "한식"],
    image: "https://loremflickr.com/1200/800/pork-belly?lock=9010",
    menus: ["흑돼지오겹", "김치찌개", "멜젓소스"],
  },
];

const ENRICHED_REQUESTS = REQUESTS.map((item, index) => {
  if (item.introParagraphs && item.menuImages && item.recommendationBullets) {
    return item;
  }

  const signatureMenu = item.menus?.[0] ?? "시그니처 메뉴";
  const secondMenu = item.menus?.[1] ?? "대표 메뉴";
  const thirdMenu = item.menus?.[2] ?? "인기 메뉴";

  return {
    ...item,
    menuImages: item.menuImages ?? [
      `https://loremflickr.com/900/600/restaurant-food?lock=${9200 + index * 3 + 1}`,
      `https://loremflickr.com/900/600/plated-food?lock=${9200 + index * 3 + 2}`,
      `https://loremflickr.com/900/600/korean-food?lock=${9200 + index * 3 + 3}`,
    ],
    introParagraphs: item.introParagraphs ?? [
      `${item.name}은(는) ${item.address} 인근에서 꾸준히 재방문이 이어지는 매장으로, 처음 방문한 손님도 편하게 즐길 수 있는 안정적인 메뉴 구성이 강점입니다.`,
      `대표 메뉴인 ${signatureMenu}를 중심으로 ${secondMenu}, ${thirdMenu}까지 조합했을 때 식사 만족도가 높아 2~4인 방문에 특히 좋은 평가를 받고 있습니다.`,
      `매장 운영 동선이 깔끔하고 주문 후 제공 속도가 안정적이라 피크 타임에도 체감 대기 시간이 과도하게 길지 않으며, 전반적인 서비스 응대도 친절한 편입니다.`,
      `사진 촬영이 잘 나오는 플레이팅과 균형 잡힌 간 구성 덕분에 데이트, 가족 식사, 지인 모임 등 다양한 목적의 방문에서 만족도가 높은 편입니다.`,
      `한 번 방문한 뒤 계절 메뉴나 신메뉴를 경험하기 위해 다시 찾는 손님이 많아 지역 내에서 입소문이 꾸준히 이어지고 있습니다.`,
    ],
    recommendationBullets: item.recommendationBullets ?? [
      `${signatureMenu} 포함 대표 메뉴를 골고루 맛보고 싶은 방문자`,
      "처음 방문해도 실패 확률이 낮은 검증된 식당을 찾는 분",
      "데이트/모임/가족식사 모두 가능한 밸런스 좋은 매장을 찾는 분",
      "사진 퀄리티와 맛, 서비스까지 고르게 챙기고 싶은 분",
    ],
  };
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildDescriptionHtml(item) {
  const representativeSourceImage = item.image;
  const menuLis = item.menus.map((m) => `<li>${m}</li>`).join("");
  const introParagraphs = item.introParagraphs ?? [
    `${item.name}은(는) 현지 방문자 재방문율이 높은 매장입니다. 좌석 회전이 안정적이고 조리 편차가 적어 처음 방문해도 만족도가 높은 편입니다.`,
    "매장 동선이 깔끔하고 주문-서빙 속도가 빨라 점심/저녁 피크 시간대에도 체감 대기 시간이 길지 않습니다.",
  ];
  const recommendationBullets = item.recommendationBullets ?? [
    "메인 메뉴와 사이드 구성의 밸런스가 좋아 2~3인 방문에 적합",
    "사진 촬영이 쉬운 플레이트 구성과 안정적인 조명",
    "초행 방문자도 찾기 쉬운 위치와 접근성",
  ];
  const menuImages = item.menuImages ?? [
    `https://loremflickr.com/900/600/food?lock=${9401 + Math.floor(Math.random() * 1000)}`,
    `https://loremflickr.com/900/600/meal?lock=${9402 + Math.floor(Math.random() * 1000)}`,
    `https://loremflickr.com/900/600/restaurant-food?lock=${9403 + Math.floor(Math.random() * 1000)}`,
  ];
  const introHtml = introParagraphs
    .map((text) => `<p style="line-height:1.85;color:#374151;margin:0 0 10px;">${text}</p>`)
    .join("");
  const recommendationHtml = recommendationBullets
    .map((text) => `<li>${text}</li>`)
    .join("");
  const menuImageHtml = menuImages
    .slice(0, 3)
    .map(
      (src, idx) =>
        `<img src="${src}" alt="${item.name} 메뉴사진 ${idx + 1}" style="width:calc(33.333% - 8px);min-width:180px;max-width:260px;border-radius:10px;object-fit:cover;border:1px solid #e5e7eb;" />`,
    )
    .join("");
  return `
<article>
  <h2 style="margin:0 0 12px;color:#222;">${item.name}</h2>
  <p style="color:#555;margin:0 0 16px;">주소: ${item.address}</p>
  <p><img src="${representativeSourceImage}" alt="${item.name} 대표사진" style="width:100%;max-width:760px;border-radius:10px;" /></p>

  <h3 style="margin:20px 0 8px;color:#1f2937;">맛집소개</h3>
  ${introHtml}

  <h3 style="margin:20px 0 8px;color:#1f2937;">대표메뉴</h3>
  <ul style="line-height:1.8;color:#374151;">${menuLis}</ul>

  <h3 style="margin:20px 0 8px;color:#1f2937;">메뉴 사진</h3>
  <div style="display:flex;flex-wrap:wrap;gap:12px;margin:4px 0 8px;">
    ${menuImageHtml}
  </div>

  <h3 style="margin:20px 0 8px;color:#1f2937;">추천포인트</h3>
  <ul style="line-height:1.8;color:#374151;">${recommendationHtml}</ul>
</article>
`.trim();
}

async function login() {
  const response = await fetch(`${API_BASE}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    }),
    redirect: "manual",
  });

  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error(
      `로그인 실패: ${API_BASE}/api/auth 응답에서 쿠키를 받지 못했습니다. 계정(${LOGIN_EMAIL})과 서버 상태를 확인하세요.`,
    );
  }
  return setCookie.split(";")[0];
}

async function apiPost(path, body, cookie) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });
  return response;
}

async function uploadWithPresignedUrl(uploadUrl, bytes, contentType) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: bytes,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`S3 PUT 실패(${response.status}): ${text.slice(0, 160)}`);
  }
}

function resolvePublicUrl(fileUrlOrKey) {
  const value = (fileUrlOrKey ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  return `${S3_PUBLIC_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

async function createLicenseFileKey(cookie, index) {
  const fileName = `seed-license-${String(index + 1).padStart(2, "0")}.pdf`;
  const contentType = "application/pdf";
  const presignedRes = await apiPost(
    "/api/restaurants/licenses/presigned-url",
    { fileName, contentType },
    cookie,
  );
  if (!presignedRes.ok) {
    const text = await presignedRes.text().catch(() => "");
    throw new Error(`사업자등록증 presigned-url 생성 실패(${presignedRes.status}): ${text.slice(0, 180)}`);
  }

  const presignedJson = await presignedRes.json();
  const uploadUrl = presignedJson?.data?.uploadUrl;
  const fileKey = presignedJson?.data?.fileKey;
  if (!uploadUrl || !fileKey) {
    throw new Error("사업자등록증 presigned 응답 형식이 올바르지 않습니다.");
  }

  const fakePdfBytes = Buffer.from(
    `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 54 >>\nstream\nBT /F1 18 Tf 30 140 Td (Seed License ${index + 1}) Tj ET\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`,
    "utf8",
  );

  await uploadWithPresignedUrl(uploadUrl, fakePdfBytes, contentType);
  return fileKey;
}

async function createRepresentativeImageUrl(cookie, imageSourceUrl, index) {
  let sourceRes = await fetch(imageSourceUrl);
  if (!sourceRes.ok) {
    sourceRes = await fetch(`https://loremflickr.com/1200/800/food?lock=${9800 + index}`);
  }
  if (!sourceRes.ok) {
    throw new Error(`대표사진 원본 다운로드 실패(${sourceRes.status})`);
  }

  const bytes = Buffer.from(await sourceRes.arrayBuffer());
  const contentType = sourceRes.headers.get("content-type") || "image/jpeg";
  const extension =
    contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

  let presignedRes = await apiPost(
    "/api/restaurants/images/presigned-url",
    { fileName: `seed-restaurant-${index + 1}.${extension}`, contentType },
    cookie,
  );

  if (!presignedRes.ok) {
    presignedRes = await apiPost(
      "/api/boards/images/presigned-url",
      { fileName: `seed-restaurant-${index + 1}.${extension}`, contentType },
      cookie,
    );
  }

  if (!presignedRes.ok) {
    const text = await presignedRes.text().catch(() => "");
    throw new Error(`대표사진 presigned-url 생성 실패(${presignedRes.status}): ${text.slice(0, 180)}`);
  }

  const presignedJson = await presignedRes.json();
  const uploadUrl = presignedJson?.data?.uploadUrl;
  const fileUrlOrKey =
    presignedJson?.data?.fileUrl ??
    presignedJson?.data?.fileKey ??
    (typeof uploadUrl === "string" ? uploadUrl.split("?")[0] : "");

  if (!uploadUrl || !fileUrlOrKey) {
    throw new Error("대표사진 presigned 응답 형식이 올바르지 않습니다.");
  }

  await uploadWithPresignedUrl(uploadUrl, bytes, contentType);
  return resolvePublicUrl(fileUrlOrKey);
}

async function createRestaurantRequest(cookie, item, index) {
  const businessLicenseFileKey = await createLicenseFileKey(cookie, index);
  const representativeSourceImage = item.thumbnailImage ?? item.menuImages?.[0] ?? item.image;
  const imageUrl = await createRepresentativeImageUrl(cookie, representativeSourceImage, index);

  const payload = {
    name: item.name,
    address: item.address,
    latitude: item.latitude,
    longitude: item.longitude,
    phone: item.phone,
    description: buildDescriptionHtml(item),
    businessLicenseFileKey,
    imageUrl,
    categoryNames: item.categories.filter((c) => CATEGORY_OPTIONS.includes(c)),
  };

  const response = await fetch(`${API_BASE}/api/restaurants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Cookie: cookie,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`신청 등록 실패(${response.status}): ${text.slice(0, 200)}`);
  }

  const json = await response.json();
  return json?.data?.id ?? null;
}

async function main() {
  console.log(`[START] API=${API_BASE}`);
  const cookie = await login();
  console.log(`[OK] 로그인 완료: ${LOGIN_EMAIL}`);

  const created = [];
  for (let i = 0; i < ENRICHED_REQUESTS.length; i += 1) {
    const item = ENRICHED_REQUESTS[i];
    try {
      const id = await createRestaurantRequest(cookie, item, i);
      created.push({ id, name: item.name });
      console.log(`[OK] ${i + 1}/${ENRICHED_REQUESTS.length} 등록: ${item.name} (id=${id ?? "unknown"})`);
      await sleep(150);
    } catch (error) {
      console.error(`[FAIL] ${i + 1}/${ENRICHED_REQUESTS.length} ${item.name}:`, error.message);
    }
  }

  console.log("\n=== 결과 ===");
  console.log(`성공: ${created.length}건 / 총 ${ENRICHED_REQUESTS.length}건`);
  created.forEach((c, idx) => {
    console.log(`${idx + 1}. id=${c.id ?? "-"} / ${c.name}`);
  });
}

main().catch((error) => {
  console.error("[FATAL]", error);
  process.exit(1);
});
