$ErrorActionPreference = "Stop"

$login = @{ email = "test@naver.com"; password = "12345678" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8081/api/auth" -Method POST -ContentType "application/json" -Body $login -SessionVariable sess -UseBasicParsing | Out-Null

$posts = @(
  @{ title = "이태원 수제버거: 육즙 가득한 클래식 치즈버거"; dish = "burger"; side = "감자튀김" },
  @{ title = "연남동 파스타: 봉골레와 화이트와인 조합"; dish = "pasta"; side = "루꼴라 샐러드" },
  @{ title = "망원동 스시 오마카세: 한 점씩 완성도 높은 코스"; dish = "sushi"; side = "사케" },
  @{ title = "잠실 스테이크: 채끝 미디엄레어 추천"; dish = "steak"; side = "매시드포테이토" },
  @{ title = "성수 브런치: 팬케이크와 에그 스크램블"; dish = "brunch"; side = "아메리카노" },
  @{ title = "홍대 라멘: 진한 돈코츠와 차슈 밸런스"; dish = "ramen"; side = "교자" },
  @{ title = "강남 쌀국수: 양지와 숙주 조합이 좋은 집"; dish = "pho"; side = "스프링롤" },
  @{ title = "을지로 중식: 마라샹궈와 꿔바로우 한상"; dish = "chinese-food"; side = "볶음밥" },
  @{ title = "한남동 디저트: 티라미수와 라떼 궁합"; dish = "dessert"; side = "카페라떼" },
  @{ title = "광화문 한식: 제육볶음 정식 든든한 한 끼"; dish = "korean-food"; side = "된장찌개" }
)

$created = @()

for ($i = 0; $i -lt $posts.Count; $i++) {
  $post = $posts[$i]
  $n = $i + 1

  $img1 = "https://loremflickr.com/1200/700/$($post.dish)?lock=$($n*3)"
  $img2 = "https://loremflickr.com/1200/700/$($post.dish)?lock=$($n*3+1)"

  $content = @"
<h2>$($post.title)</h2>
<p>주말 저녁 시간에 방문해 직접 식사한 후기입니다. 매장은 전체적으로 깔끔했고, 좌석 간 간격이 넓어 대화와 식사를 동시에 즐기기 좋았습니다. 직원 응대도 빠르고 주문 동선이 단순해 첫 방문임에도 불편함이 없었습니다.</p>
<p><img src='$img1' alt='음식 사진 1' /></p>
<h3>메뉴 후기</h3>
<p>대표 메뉴는 첫 입에서 풍미가 또렷하게 올라오고, 먹을수록 재료의 조합이 안정적이라는 인상이 강했습니다. 간이 과하지 않고 온도 유지가 잘 되어 마지막까지 맛이 무너지지 않았습니다. 플레이팅도 깔끔해서 시각적으로도 만족도가 높았습니다.</p>
<p>특히 식감의 대비가 좋아 단조롭지 않았습니다. 메인의 밀도감과 곁들임 메뉴의 산뜻함이 균형을 맞춰 주었고, 과한 자극 없이 깔끔하게 마무리되는 점이 좋았습니다.</p>
<h3>추천 조합</h3>
<ul>
  <li>메인 메뉴 + $($post.side) 조합 추천</li>
  <li>추천 방문 시간: 평일 18시 이전</li>
  <li>재방문 의사: 매우 높음</li>
</ul>
<p><img src='$img2' alt='음식 사진 2' /></p>
<h3>총평</h3>
<p>분위기, 서비스, 맛의 밸런스가 좋은 매장이라 누구와 방문해도 만족도가 높을 곳입니다. 처음 방문한다면 시그니처 중심으로 주문하고 사이드를 한 가지 추가하는 구성을 추천합니다. 한줄평으로는 "완성도 높은 음식과 편안한 분위기를 동시에 잡은 곳"입니다.</p>
"@

  $body = @{
    title = $post.title
    content = $content
    contentHtml = $content
    contentDelta = $null
    boardType = "REVIEW"
    imageUrl = $img1
  } | ConvertTo-Json -Depth 8

  $resp = Invoke-RestMethod -Uri "http://localhost:8081/api/blogs" -Method POST -ContentType "application/json; charset=utf-8" -Body $body -WebSession $sess
  $created += [PSCustomObject]@{ id = $resp.data; title = $post.title; image = $img1 }
}

$created | ConvertTo-Json -Depth 4
