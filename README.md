# 사주미 (SAJU ME)

생년월일·태어난 시간·성별·양력/음력을 입력하면, Gemini가 사주 기본 차트를 바탕으로 성격·기질·재능을 해석해 주는 웹 서비스입니다.

## 주요 기능

- 사주 입력 폼 (이름, 생년월일, 시간, 성별, 양력/음력)
- Gemini API 스트리밍 해석 (글자가 실시간으로 표시)
- 해석 중 스켈레톤 UI
- 마크다운 결과를 읽기 쉬운 화면으로 렌더링

## 기술 스택

- React 19 + Vite
- `@google/genai` (Gemini)
- `react-markdown` (해석 결과 표시)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. API 키 설정

[Google AI Studio](https://aistudio.google.com/apikey)에서 API 키를 발급한 뒤, 프로젝트 루트에 `.env` 파일을 만듭니다.

```bash
cp .env.example .env
```

`.env` 내용:

```env
VITE_GEMINI_API_KEY=발급받은_키
```

- 키 앞뒤에 공백·따옴표를 넣지 마세요.
- `.env`는 Git에 올라가지 않습니다. (`.gitignore`에 포함)
- `.env`를 수정한 뒤에는 dev 서버를 다시 실행해야 반영됩니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

### 4. 빌드

```bash
npm run build
npm run preview
```

## 프로젝트 구조

```text
src/
  App.jsx          # 입력 폼 + 결과 UI
  App.css          # 스타일
  gemini.js        # Gemini 스트리밍 호출
  sajuPrompt.js    # 사주 해석 프롬프트
  main.jsx         # 앱 진입점
```

## 참고

- 현재 사주 명식(기본 차트) 데이터는 학습/데모용으로 프롬프트에 고정되어 있습니다. 입력한 생년월일과 실제 명식이 다를 수 있습니다.
- `VITE_` 로 시작하는 환경 변수는 브라우저에 노출됩니다. 학습용이 아니라면 나중에 서버에서 API를 호출하는 방식으로 바꾸는 것을 권장합니다.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 |

