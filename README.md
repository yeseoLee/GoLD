# GoLD

바둑 사활문제(Life and Death Problems in Go) 풀이용 정적 웹앱 MVP입니다.

## 시작

```bash
npm install
npm run data:fetch
npm run verify
npm run dev
```

## 데이터 정책

- 승인된 공개 소스만 `data/sources.json`에 등록합니다.
- 라이선스 근거 URL이 없는 소스는 `npm run data:validate`에서 실패합니다.
- 최종 문제는 저장소 소유 `data/problems/*.sgf`에 한 문제당 한 파일로 보관합니다.

## 주요 스크립트

- `npm run data:fetch`: 승인된 공개 소스 원본을 `data/raw/`에 내려받기
- `npm run data:validate`: 라이선스 근거, 카탈로그 매핑, SGF 규약 검사
- `npm run data:build`: SGF를 런타임 JSON으로 컴파일
- `npm run verify`: lint + test + data validate + data build + production build
