$ErrorActionPreference = "Stop"
$login = @{ email = "test@naver.com"; password = "12345678" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8081/api/auth" -Method POST -ContentType "application/json" -Body $login -SessionVariable sess -UseBasicParsing | Out-Null

$titles = @(
  "성수 골목 파스타: 트러플 크림의 정석",
  "해방촌 브런치: 아침부터 기분 좋아지는 한 접시",
  "홍대 라멘: 진한 돈코츠와 깔끔한 마무리",
  "을지로 중식당: 유니짜장과 탕수육 조합 추천",
  "연남동 카레: 향신료 레이어가 살아있는 한 그릇",
  "잠실 스테이크 하우스: 특별한 날 디너 코스",
  "광화문 국밥: 든든하고 깔끔한 한 끼",
  "망원 디저트 카페: 케이크와 커피 밸런스 최고",
  "강남 베트남 음식점: 쌀국수와 분짜 완성형",
  "한남동 와인바: 분위기와 음식 밸런스가 좋은 곳"
)

$created = @()
for ($i = 0; $i -lt $titles.Count; $i++) {
  $title = $titles[$i]
  $n = $i + 1
  $img1 = "https://picsum.photos/seed/matjip-review-$n/1200/700"
  $img2 = "https://picsum.photos/seed/matjip-review-$n-b/1200/700"

  $content = @"
<h2>$title</h2>
<p>이번 주에 직접 방문해서 식사한 후기입니다. 매장 분위기, 좌석 간격, 응대 속도까지 전반적으로 안정적이었고, 첫인상부터 만족도가 높았습니다. 조명과 음악 밸런스가 좋아서 식사와 대화 모두 편하게 즐길 수 있었습니다.</p>
<p><img src='$img1' alt='대표 메뉴 사진' /></p>
<h3>맛과 구성</h3>
<p>대표 메뉴는 재료의 질감이 살아 있었고 간이 과하지 않아 끝까지 부담 없이 먹기 좋았습니다. 메인 메뉴의 완성도뿐 아니라 함께 주문한 사이드와 음료의 연결감도 좋았고, 전체 코스처럼 매끄럽게 이어졌습니다. 플레이팅이 깔끔해 사진으로 남기기에도 충분히 만족스러웠습니다.</p>
<p>특히 좋았던 부분은 한 입마다 맛의 레이어가 자연스럽게 이어진다는 점입니다. 첫맛은 선명하고, 중간에는 고소함이나 감칠맛이 올라오며, 마무리는 깔끔하게 떨어집니다. 같은 메뉴를 다시 주문해도 만족할 가능성이 높다고 느꼈습니다.</p>
<ul><li>추천 방문 시간: 평일 18시 이전</li><li>추천 대상: 데이트, 친구 모임, 혼밥</li><li>재방문 의사: 매우 높음</li></ul>
<p><img src='$img2' alt='매장 분위기 사진' /></p>
<h3>총평</h3>
<p>가격 대비 만족도, 분위기, 서비스 품질을 종합하면 재방문 가치가 충분한 매장입니다. 처음 방문하는 분이라면 시그니처 메뉴 중심으로 주문하고 사이드를 하나 더하는 조합을 추천합니다. 한줄평으로 정리하면 분위기와 맛의 균형이 좋은 곳입니다.</p>
"@

  $body = @{
    title = $title
    content = $content
    contentHtml = $content
    contentDelta = $null
    boardType = "REVIEW"
    imageUrl = $img1
  } | ConvertTo-Json -Depth 8

  $resp = Invoke-RestMethod -Uri "http://localhost:8081/api/blogs" -Method POST -ContentType "application/json; charset=utf-8" -Body $body -WebSession $sess
  $created += [PSCustomObject]@{ id = $resp.data; title = $title }
}

$created | ConvertTo-Json -Depth 4
