$ErrorActionPreference = "Stop"

$login = @{ email = "test@naver.com"; password = "12345678" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8081/api/auth" -Method POST -ContentType "application/json" -Body $login -SessionVariable sess -UseBasicParsing | Out-Null

$posts = @(
  @{ title = "[성수] 화덕피자집 도우앤치즈 솔직후기"; place = "도우앤치즈"; location = "성수"; dish = "pizza"; vibe = "우드톤 인테리어" },
  @{ title = "[연남] 라멘집 멘야하루 진한 국물 리뷰"; place = "멘야하루"; location = "연남"; dish = "ramen"; vibe = "바 테이블 중심" },
  @{ title = "[망원] 스시집 오마카세하우스 런치코스 후기"; place = "오마카세하우스"; location = "망원"; dish = "sushi"; vibe = "조용한 다찌" },
  @{ title = "[잠실] 스테이크집 그릴포인트 디너 방문기"; place = "그릴포인트"; location = "잠실"; dish = "steak"; vibe = "모던한 조명" },
  @{ title = "[홍대] 브런치카페 모닝테이블 주말 후기"; place = "모닝테이블"; location = "홍대"; dish = "brunch"; vibe = "채광 좋은 창가" },
  @{ title = "[을지로] 중식당 홍복루 마라샹궈 추천"; place = "홍복루"; location = "을지로"; dish = "chinese-food"; vibe = "레트로 감성" },
  @{ title = "[강남] 베트남음식점 사이공키친 쌀국수"; place = "사이공키친"; location = "강남"; dish = "pho"; vibe = "깔끔한 오픈키친" },
  @{ title = "[광화문] 한식당 밥상연구소 제육정식"; place = "밥상연구소"; location = "광화문"; dish = "korean-food"; vibe = "직장인 점심 분위기" },
  @{ title = "[한남] 디저트카페 스윗룸 티라미수 리뷰"; place = "스윗룸"; location = "한남"; dish = "dessert"; vibe = "잔잔한 음악" },
  @{ title = "[이태원] 수제버거집 번앤패티 재방문 후기"; place = "번앤패티"; location = "이태원"; dish = "burger"; vibe = "캐주얼한 좌석" }
)

$created = @()
for ($i = 0; $i -lt $posts.Count; $i++) {
  $post = $posts[$i]
  $n = $i + 1

  $img1 = "https://loremflickr.com/1200/700/$($post.dish)?lock=$($n*10+1)"
  $img2 = "https://loremflickr.com/1200/700/$($post.dish)?lock=$($n*10+2)"
  $img3 = "https://loremflickr.com/1200/700/$($post.dish)?lock=$($n*10+3)"

  $content = @"
<h2>$($post.place) 방문 후기</h2>
<p>$($post.location)에 있는 <strong>$($post.place)</strong>에 다녀왔습니다. 전체적으로 $($post.vibe) 느낌이라 식사하는 동안 편안했고, 직원 응대 속도도 빨라서 첫인상이 좋았습니다.</p>
<h3>메뉴와 맛</h3>
<p>대표 메뉴는 간이 과하지 않고 재료 맛이 살아 있어서 먹을수록 만족도가 높았습니다. 한 입 먹었을 때 풍미가 확실히 올라오고, 끝맛이 깔끔해서 물리지 않았습니다. 양도 적당해서 2인 방문 기준 사이드 하나 추가하면 딱 좋았습니다.</p>
<p><img src='$img1' alt='음식 사진 1' /></p>
<h3>사진 포인트 1</h3>
<p>첫 번째 사진은 대표 메뉴의 비주얼 중심으로 찍었습니다. 접시 구성과 소스 디테일이 잘 보여서 메뉴 선택 참고용으로 좋습니다.</p>
<p><img src='$img2' alt='음식 사진 2' /></p>
<h3>사진 포인트 2</h3>
<p>두 번째 사진은 사이드와 함께 나온 한 상 구성을 담았습니다. 실제 방문 시 어떤 조합으로 주문하면 좋은지 감이 오도록 구성했습니다.</p>
<p><img src='$img3' alt='음식 사진 3' /></p>
<h3>총평</h3>
<ul>
  <li>재방문 의사: 높음</li>
  <li>추천 방문 시간: 평일 18시 이전</li>
  <li>추천 대상: 친구 모임, 데이트, 혼밥</li>
</ul>
<p>한줄평: <strong>$($post.place)</strong>은 분위기와 음식 밸런스가 좋고, 사진도 예쁘게 나오는 매장입니다.</p>
"@

  $body = @{
    title = $post.title
    content = $content
    contentHtml = $content
    contentDelta = $null
    boardType = "REVIEW"
    imageUrl = $img1
  } | ConvertTo-Json -Depth 10

  $resp = Invoke-RestMethod -Uri "http://localhost:8081/api/blogs" -Method POST -ContentType "application/json; charset=utf-8" -Body $body -WebSession $sess
  $created += [PSCustomObject]@{ id = $resp.data; title = $post.title; thumb = $img1 }
}

$created | ConvertTo-Json -Depth 4
