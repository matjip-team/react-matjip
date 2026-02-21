#!/usr/bin/env node
/**
 * 맛집 소개 블로그 10개 등록 (길고 자세한 실제 리뷰 형식)
 * - 위치, 소개, 평점, 이미지, 색상 포함
 * 실행: node scripts/seed-blog-10-matjip.mjs
 */

const API = "http://localhost:8081";

const posts = [
  {
    title: "[강남] 솔솔 쌀국수 - 양지 쌀국수가 일품인 베트남 맛집",
    place: "솔솔 쌀국수",
    location: "서울 강남구 강남대로 428 (강남역 3번 출구 도보 5분)",
    rating: "4.5",
    price: "10,000원~",
    img: "https://loremflickr.com/1200/700/pho?lock=201",
  },
  {
    title: "[홍대] 멘야하루 - 진한 돈코츠 라멘과 교자의 조화",
    place: "멘야하루",
    location: "서울 마포구 와우산로 29길 (홍대입구역 9번 출구 도보 3분)",
    rating: "4.8",
    price: "9,500원~",
    img: "https://loremflickr.com/1200/700/ramen?lock=202",
  },
  {
    title: "[성수] 라비올리 아뜨리에 - 트러플 크림 파스타 전문",
    place: "라비올리 아뜨리에",
    location: "서울 성동구 성수동2가 (성수역 1번 출구 도보 7분)",
    rating: "4.6",
    price: "18,000원~",
    img: "https://loremflickr.com/1200/700/pasta?lock=203",
  },
  {
    title: "[망원] 스시 스미다 - 런치 오마카세 추천",
    place: "스시 스미다",
    location: "서울 마포구 망원동 (망원역 1번 출구 앞)",
    rating: "4.7",
    price: "35,000원~",
    img: "https://loremflickr.com/1200/700/sushi?lock=204",
  },
  {
    title: "[잠실] 그릴포인트 - 미디엄레어 스테이크 전문",
    place: "그릴포인트",
    location: "서울 송파구 잠실동 (잠실역 인근 로데오거리)",
    rating: "4.4",
    price: "42,000원~",
    img: "https://loremflickr.com/1200/700/steak?lock=205",
  },
  {
    title: "[연남] 모닝테이블 - 브런치와 팬케이크",
    place: "모닝테이블",
    location: "서울 마포구 연남동 (연남동 카페 골목)",
    rating: "4.5",
    price: "14,000원~",
    img: "https://loremflickr.com/1200/700/brunch?lock=206",
  },
  {
    title: "[을지로] 홍복루 - 꿔바로우와 마라탕 한 상",
    place: "홍복루",
    location: "서울 중구 을지로 (을지로3가역 2번 출구 도보 4분)",
    rating: "4.3",
    price: "8,000원~",
    img: "https://loremflickr.com/1200/700/chinese-food?lock=207",
  },
  {
    title: "[광화문] 밥상연구소 - 제육정식 든든한 한 끼",
    place: "밥상연구소",
    location: "서울 종로구 종로 (광화문역 5번 출구 건너편)",
    rating: "4.2",
    price: "9,000원~",
    img: "https://loremflickr.com/1200/700/korean-food?lock=208",
  },
  {
    title: "[한남] 스윗룸 - 티라미수와 라떼",
    place: "스윗룸",
    location: "서울 용산구 한남동 (한남역 2번 출구 도보 6분)",
    rating: "4.6",
    price: "7,500원~",
    img: "https://loremflickr.com/1200/700/dessert?lock=209",
  },
  {
    title: "[이태원] 번앤패티 - 육즙 가득 수제 버거",
    place: "번앤패티",
    location: "서울 용산구 이태원동 (이태원역 도보 7분)",
    rating: "4.5",
    price: "13,000원~",
    img: "https://loremflickr.com/1200/700/burger?lock=210",
  },
];

const getContent = (p) => `
<article>
<h2 style="color:#1a1a1a;font-size:1.5em;margin-bottom:12px;border-bottom:2px solid #ff6b00;padding-bottom:8px;">📍 ${p.place}</h2>

<p style="color:#64748b;font-size:0.95em;margin-bottom:16px;"><strong style="color:#334155;">위치</strong> ${p.location}</p>
<p style="color:#64748b;font-size:0.95em;margin-bottom:20px;"><strong style="color:#334155;">가격대</strong> <span style="color:#059669;font-weight:600;">${p.price}</span></p>

<p><img src="${p.img}" alt="${p.place} 대표 메뉴" style="width:100%;max-width:800px;height:auto;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);" /></p>

<h3 style="color:#1e3a5f;font-size:1.2em;margin:24px 0 12px;">🍽 맛집 소개</h3>
<p style="color:#334155;line-height:1.8;">이번에 친구와 함께 방문한 <strong style="color:#1a1a1a;">${p.place}</strong>입니다. 예전부터 SNS에서 자주 보이던 맛집이라 기대를 갖고 찾아갔는데, 기대를 저버리지 않는 식사였습니다. 매장은 예상보다 넓었고 좌석 간격도 충분해서 대화하기 편했습니다. 직원 분들이 주문 확인부터 서빙까지 꼼꼼하게 챙겨 주셔서 첫 방문임에도 불구하고 전혀 당황스럽지 않았어요.</p>

<h3 style="color:#1e3a5f;font-size:1.2em;margin:24px 0 12px;">✨ 메뉴 후기</h3>
<p style="color:#334155;line-height:1.8;">대표 메뉴를 주문해 봤는데, 재료의 신선함이 입안에서 확 느껴졌습니다. 간도 과하지 않고 은은하게 배어 있어서 끝까지 맛있게 먹을 수 있었어요. 플레이팅도 깔끔해서 사진 찍기에도 좋았고, 양도 적당해서 2인 기준 사이드 하나 추가하면 딱 좋을 것 같습니다. 다음엔 다른 메뉴도 꼭 맛보러 가려고요.</p>

<h3 style="color:#1e3a5f;font-size:1.2em;margin:24px 0 12px;">💡 분위기 & 서비스</h3>
<p style="color:#334155;line-height:1.8;">매장 인테리어가 전체적으로 세련됐고, 조명과 음악이 식사하기에 편한 분위기를 만들어 주었습니다. 웨이팅이 있을 수 있으니 평일 18시 이전 방문을 추천드립니다. 혼밥하기에도 부담 없는 분위기라 직장인 분들께 특히 추천하고 싶네요.</p>

<h3 style="color:#1e3a5f;font-size:1.2em;margin:24px 0 12px;">⭐ 평점 및 총평</h3>
<p style="color:#334155;line-height:1.8;">가격 대비 만족도가 매우 높았습니다. <strong style="color:#dc2626;font-size:1.1em;">별점 <span style="color:#ea580c;">${p.rating}</span>/5.0</strong>를 드립니다. 재방문 의사 100%이고, 주변 지인들에게도 적극 추천할 예정입니다.</p>

<ul style="color:#475569;line-height:1.8;padding-left:20px;">
<li><strong style="color:#334155;">추천 방문 시간</strong> 평일 18시 이전 (웨이팅 최소화)</li>
<li><strong style="color:#334155;">추천 대상</strong> 혼밥, 데이트, 친구 모임</li>
<li><strong style="color:#334155;">재방문 의사</strong> 매우 높음</li>
</ul>
</article>
`;

async function main() {
  const res = await fetch(`${API}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@naver.com", password: "12345678" }),
    redirect: "manual",
  });
  const cookies = res.headers.get("set-cookie");
  if (!cookies) {
    console.error("로그인 실패. 백엔드(localhost:8081) 실행 및 test@naver.com 계정 확인 필요.");
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
    const r = await fetch(`${API}/api/blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Cookie: cookie,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      console.error("실패:", p.title, r.status);
      continue;
    }
    const data = await r.json();
    created.push({ id: data.data, title: p.title });
    console.log("등록:", p.title);
  }
  console.log("\n총", created.length, "개 블로그 글이 등록되었습니다.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
