# 슬기로운 말글마이너 — YouTube 댓글편

> 누구나 쉽게, 국어 수업에서 텍스트마이닝을 할 수 있도록 만든 웹 기반 분석 도구

**배포 주소**: https://riedle03.github.io/youtubecrawling/

---

## 📌 개요

중·고등학교 국어 수업에서 YouTube 댓글을 활용한 텍스트마이닝 수업을 진행하기 위해 개발한 순수 브라우저 기반 웹앱입니다. 설치 없이 브라우저에서 바로 사용할 수 있으며, GitHub Pages로 정적 배포됩니다.

### 주요 기능

| 단계 | 기능 |
|------|------|
| Step 1 | YouTube Data API v3로 댓글 수집 |
| Step 2 | 형태소 분석 / 불용어 제거 / 단어 통합 |
| Step 3 | 빈도수 계산 및 테이블 |
| Step 4 | Chart.js 막대차트 시각화 |
| Step 5 | 워드클라우드 (wordcloud2.js) |
| Step 6 | 공기어 네트워크 그래프 SNA (D3.js) |

---

## 🛠 기술 스택

- **UI**: Vanilla JS + Tailwind CSS (CDN)
- **폰트**: Pretendard
- **차트**: Chart.js 4.4.0
- **워드클라우드**: wordcloud2.js 1.2.2
- **네트워크**: D3.js 7.9.0
- **형태소 분석**: 바른(Bareun) API
- **호스팅**: GitHub Pages

---

## 🤖 Claude Code와 함께한 개발 과정

이 프로젝트는 **Claude Code (Anthropic)**와 대화하며 처음부터 끝까지 제작되었습니다.

### 1단계 — 기획 및 설계

- YouTube 댓글 텍스트마이닝 수업용 도구 필요성 확인
- 6단계 분석 파이프라인 설계 (수집 → 전처리 → 빈도 → 차트 → 워드클라우드 → SNA)
- 순수 정적 웹앱(Vanilla JS)으로 결정 — 설치 없이 누구나 사용 가능

### 2단계 — 핵심 기능 구현

- YouTube Data API v3 댓글 크롤러 구현 (Step 1)
- 한국어 전처리 엔진 구현: 조사 제거, 불용어 필터, 최소 글자 수 (Step 2)
- 빈도수 계산 및 테이블 UI (Step 3)
- Chart.js 막대차트 (Step 4)
- wordcloud2.js 워드클라우드 (Step 5)
- D3.js 공기어 네트워크 SNA 그래프 (Step 6)

### 3단계 — 주요 버그 수정

#### 워드클라우드 렌더링 문제
- 단어가 겹치거나 너무 작게 표시되는 문제
- 로그 스케일 크기 조정 + async 재시도 루프로 해결
- `_drawnListener` 누적 버그 수정

#### SNA "연결된 단어 쌍이 없습니다" 오류
- CSS 특이성 버그 발견: Tailwind `hidden` 클래스가 `display:flex` inline style을 덮어쓰지 못하는 문제
- `sna-empty` 오버레이가 항상 표시되어 SVG 이벤트를 차단
- `style="display:none"` 초기값으로 수정하여 해결

### 4단계 — 바른(Bareun) 형태소 API 통합

- 정규식 방식의 한계 극복 — "먹었어"/"먹어"/"먹었다" → "먹" 통합
- 고유 어절 배치(150개) 처리로 API 호출 최적화
- POS 태그 필터: 명사+용언어간 (NNG, NNP, NNB, VV, VA, XR)
- API 오류 시 정규식 fallback 자동 적용

### 5단계 — 단어 통합 사전(normdict) 설계 및 구현

교육 현장 데이터 분석 중 형태소 변형 문제 발견:

> "은둔형", "은둔하고", "은둔해" 등이 모두 별개 단어로 집계되는 문제

- `assets/normdict.js` 신규 설계: `{ canonical, variants[] }` 구조
- Step 2 UI에 단어 통합 사전 관리 인터페이스 추가
- 전처리 시 `variant → canonical` 자동 치환
- 은둔·고립, 취업·일, 사회·국가, 심리·정신 등 도메인 특화 사전 구축

### 6단계 — 한국어 "의" 처리 문제 해결

> **문제**: "자본주의" → "자본주"로 잘못 전처리되는 버그

**원인 분석**:
- PARTICLES 배열에 `'의'`가 포함되어 어말이 `의`인 모든 단어에서 제거
- `extractLemmas()`에서 바른 API 결과에 `stripParticle()` 2차 적용이 문제

**해결**:
1. `extractLemmas()`에서 `stripParticle()` 제거 → 바른 API POS 태그 신뢰
2. PARTICLES에 `'의'` 유지 → regex fallback에서 "나의"→"나" 정상 처리
3. 결과: `자본주의(NNG)` 보존 ✓ / `나의(NP+JKG)` → "나" ✓

### 7단계 — 새 전처리 모드 추가: 조사 제거(bareun_josa)

- 바른 API로 **조사 태그(JKS/JKG/JKO/JX 등)만 제거**하는 중간 모드 구현
- 활용형 원형 유지 / "자본주의" 등 어근 보존
- `buildLemmaMap(extractFn)` 추상화로 모드별 추출 함수 주입 구조로 리팩터링

### 8단계 — 불용어 및 통합사전 고도화

실제 YouTube 댓글 데이터로 반복 전처리 테스트 후 지속 보완:

- **불용어**: 200개+ (지시대명사, 부사, 접속사, 용언 활용형, 기능어 변형 등)
- **통합사전**: 100개+ 항목 (은둔/고립, 취업/일, 사회/주의 관련 어휘, AI/기술 용어 등)

### 9단계 — 복수형 정규화 버그 수정

> **문제**: "사람들" → 불용어 필터 통과 → "사람"으로 변환 후 결과에 등장

- 복수형 정규화(`들` 제거)가 불용어 필터 **이후**에 실행되는 순서 문제
- `finalizeResult()`에서 복수형 정규화 후 불용어 재필터 적용으로 해결

### 10단계 — GitHub 배포

- `gh auth login`으로 GitHub CLI 인증
- 저장소 생성: `gh repo create riedle03/youtubecrawling --public`
- 첫 커밋 및 push
- GitHub Pages 활성화 → `https://riedle03.github.io/youtubecrawling/`

---

## 🚀 사용 방법

### 사전 준비

1. **YouTube Data API v3 키** 발급
   - Google Cloud Console → API 라이브러리 → YouTube Data API v3 활성화
   - 사용자 인증 정보 → API 키 생성

2. **바른(Bareun) API 키** 발급 (선택, 형태소 분석용)
   - [bareun.ai](https://bareun.ai) 회원가입 → 마이페이지 → API 키 발급

### 실행

1. https://riedle03.github.io/youtubecrawling/ 접속
2. 우상단 ⚙️ 설정에서 API 키 입력
3. Step 1: YouTube 영상 URL 입력 → 댓글 수집
4. Step 2: 전처리 설정 → 실행
5. Step 3~6: 빈도분석, 차트, 워드클라우드, SNA 순서대로 진행

---

## 📁 파일 구조

```
슬기로운 말글마이너/
├── index.html              # SPA 진입점
├── css/
│   └── style.css           # 다크 글래스모피즘 스타일
├── js/
│   ├── app.js              # 전역 상태 및 라우팅
│   ├── settings.js         # API 키 관리 (localStorage)
│   ├── step1_crawler.js    # YouTube 댓글 수집
│   ├── step2_preprocess.js # 전처리 (바른 API / 정규식)
│   ├── step3_frequency.js  # 빈도수 계산
│   ├── step4_barchart.js   # 막대차트
│   ├── step5_wordcloud.js  # 워드클라우드
│   ├── step6_sna.js        # 공기어 네트워크
│   └── utils.js            # CSV/PNG 저장 유틸
└── assets/
    ├── stopwords.js        # 기본 불용어 목록
    ├── normdict.js         # 단어 통합 사전
    └── wordcloud2.js       # wordcloud2 라이브러리 (로컬)
```

---

## ✍️ 개발자

**이대형** · [riedel@e-mirim.hs.kr](mailto:riedel@e-mirim.hs.kr)

Made with ❤️ and [Claude Code](https://claude.ai/code) (Anthropic)

© 2025 이대형. All rights reserved.
