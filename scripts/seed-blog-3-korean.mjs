#!/usr/bin/env node
/**
 * 한국어 맛집 블로그 3개 직접 등록
 * 실행: node scripts/seed-blog-3-korean.mjs
 * 백엔드(localhost:8081) 실행 필요, test@naver.com 계정 필요
 */

const API = "http://localhost:8081";

const posts = [
  {
    title: "[강남] 솔솔 쌀국수 - 양지 쌀국수가 일품인 베트남 맛집",
    place: "솔솔 쌀국수",
    location: "강남역",
    rating: "4.5",
    img: "https://loremflickr.com/1200/700/pho?lock=101",
  },
  {
    title: "[홍대] 멘야하루 - 진한 돈코츠 라멘과 교자의 조화",
    place: "멘야하루",
    location: "홍대입구역",
    rating: "4.8",
    img: "https://loremflickr.com/1200/700/ramen?lock=102",
  },
  {
    title: "[성수] 라비올리 아뜨리에 - 트러플 크림 파스타 전문",
    place: "라비올리 아뜨리에",
    location: "성수동",
    rating: "4.6",
    img: "https://loremflickr.com/1200/700/pasta?lock=103",
  },
];

const getContent = (p) => `
<h2>${p.place} 소개</h2>
<p><strong>${p.location}</strong>에 위치한 <strong>${p.place}</strong>입니다. 직접 방문해 식사한 후기를 공유합니다.</p>
<p><img src="${p.img}" alt="${p.place} 대표 메뉴" style="width:100%;max-width:800px;height:auto;border-radius:12px;" /></p>
<h3>맛과 분위기</h3>
<p>매장은 깔끔하고 쾌적했습니다. 대표 메뉴는 재료가 신선하고 간이 알맞아 끝까지 맛있게 먹었습니다. 직원 분들도 친절해 첫 방문에도 편안했습니다.</p>
<h3>평점</h3>
<p><strong>별점 ${p.rating}/5.0</strong> — 가격 대비 만족도가 높고 재방문 의사가 있습니다.</p>
<ul>
<li>추천 방문: 평일 18시 이전</li>
<li>추천 대상: 혼밥, 데이트, 친구 모임</li>
</ul>
`;

async function main() {
  const res = await fetch(`${API}/api/spring/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@naver.com", password: "12345678" }),
    redirect: "manual",
  });
  const cookies = res.headers.get("set-cookie");
  if (!cookies) {
    console.error("로그인 실패 (쿠키 없음). 백엔드 실행 및 계정 확인 필요.");
    process.exit(1);
  }
  const cookie = cookies.split(";")[0];

  const created = [];
  for (const p of posts) {
    const body = {
      title: p.title,
      content: getContent(p),
      contentHtml: getContent(p),
      contentDelta: null,
      blogType: "REVIEW",
      imageUrl: p.img,
    };
    const r = await fetch(`${API}/api/spring/blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Cookie: cookie,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      console.error("실패:", p.title, r.status, await r.text());
      continue;
    }
    const data = await r.json();
    created.push({ id: data.data, title: p.title });
    console.log("등록:", p.title);
  }
  console.log("\n총", created.length, "개 블로그 글이 등록되었습니다.");
  console.log(JSON.stringify(created, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
