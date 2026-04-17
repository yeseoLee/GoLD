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

- 현재 기본 데이터셋은 [bsinglet/life_and_death_go_problems](https://github.com/bsinglet/life_and_death_go_problems)의 GPL-3.0 SGF 저장소입니다.
- 승인된 공개 소스만 `data/sources.json`에 등록합니다.
- 최종 문제는 `data/problems/*.sgf`에 한 문제당 한 파일로 보관합니다.
- `npm run data:build`는 Jago 스타일 코멘트를 읽어 정오답 분기를 추론합니다.

## 주요 스크립트

- `npm run data:fetch`: 승인된 공개 소스 원본을 `data/raw/`에 내려받기
- `npm run data:validate`: 라이선스 근거, 카탈로그 매핑, SGF 규약 검사
- `npm run data:build`: SGF를 런타임 JSON으로 컴파일
- `npm run verify`: data validate + data build + lint + test + production build
- GitHub Pages 배포는 `main` 푸시 시 `.github/workflows/pages.yml`에서 자동으로 실행됩니다.
