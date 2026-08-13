# 사주미 (SAJU ME)

생년월일만 넣으면 AI가 성격·기질·재능을 읽어 주는 사주 해석 서비스입니다.  
마스코트 너구리가 T형처럼 결론부터, 말투만 귀엽게 해석합니다.

**서비스:** [https://saju-me-sw.vercel.app](https://saju-me-sw.vercel.app)

## 주요 기능

- Google 로그인 (Supabase Auth)
- 프로필 한 번 등록 후, 다음부터는 바로 해석
- 이름·생년월일·태어난 시간·성별·양력/음력 입력
- Gemini 스트리밍 해석 (글자가 실시간으로 표시)
- 로그인 사용자별 사주 기록 저장 / 조회 / 수정 / 삭제 / 다시 해석
- 결과 공유 링크 (`/result/:id`)와 결과 복사
- Google Analytics(GA4) 페이지뷰·주요 버튼 이벤트

## 기술 스택

- React 19 + Vite
- Vercel (정적 배포, SPA rewrite)
- `@google/genai` (Gemini)
- `@supabase/supabase-js` (Auth + Database)
- `react-markdown` (해석 결과 표시)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 만듭니다.

```bash
cp .env.example .env
```

`.env` 내용:

```env
VITE_GEMINI_API_KEY=발급받은_Gemini_키
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=Supabase_publishable_또는_anon_키
```

- 키 앞뒤에 공백·따옴표를 넣지 마세요.
- `.env`는 Git에 올라가지 않습니다.
- `.env`를 수정한 뒤에는 `npm run dev`를 다시 실행해야 반영됩니다.

### 3. Google 로그인 설정 (필수)

앱은 `signInWithOAuth({ provider: 'google' })` 를 사용합니다.  
아래는 **콘솔에서 직접 해야 하는 설정**입니다.

#### A. Google Cloud — OAuth 클라이언트

1. [Google Auth Platform > Clients](https://console.cloud.google.com/auth/clients) 로 이동
2. **Create client** → Application type: **Web application**
3. **Authorized JavaScript origins**
   - `http://localhost:5173`
   - `https://saju-me-sw.vercel.app`
4. **Authorized redirect URIs**
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
5. 생성 후 **Client ID**, **Client Secret** 을 복사

#### B. Google Auth Platform — Audience / Scopes

1. [Audience](https://console.cloud.google.com/auth/audience): 테스트 중이면 본인 Google 계정을 Test users에 추가
2. [Data Access / Scopes](https://console.cloud.google.com/auth/scopes): 아래가 있는지 확인
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`

#### C. Supabase — Google provider

1. Supabase Dashboard → **Authentication → Providers → Google**
2. Enable Sign in with Google
3. Client ID / Client Secret 붙여넣기 후 Save

#### D. Supabase — Redirect URL

1. **Authentication → URL Configuration**
2. Site URL: 로컬은 `http://localhost:5173`, 배포는 `https://saju-me-sw.vercel.app`
3. Redirect URLs에 추가:
   - `http://localhost:5173`
   - `http://localhost:5173/**`
   - `https://saju-me-sw.vercel.app`
   - `https://saju-me-sw.vercel.app/**`

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속한 뒤 **Google로 계속하기**를 눌러 로그인합니다.

### 5. 빌드

```bash
npm run build
npm run preview
```

## 프로젝트 구조

```text
src/
  App.jsx                 # 홈 화면 조립
  main.jsx                # 진입점 (홈 / 공유 결과 분기)
  pages/
    ResultPage.jsx        # 공유 결과 페이지
  components/
    auth/                 # 로그인, 프로필
    sidebar/              # 계정·저장된 사주
    hero/                 # 메인 히어로
    reading/              # 사주 입력
    result/               # 사주 결과
    share/                # 공유 페이지 UI
    common/               # 공통 UI·입력 필드
  hooks/                  # 인증, 사주 워크스페이스, 공유, 토스트
  lib/                    # Supabase, Gemini, 공유, 프롬프트, GA
  utils/                  # 포맷, 프로필, 인증 에러
  styles/                 # 전역·앱 스타일
```

## 참고

- 사주 기록은 로그인한 사용자(`auth.uid()`)만 본인 데이터를 읽고/쓰고/지울 수 있습니다.
- 공유 링크는 `/result/:id` 이며, 공개 RPC로 결과만 조회합니다.
- 현재 사주 명식(기본 차트) 데이터는 학습/데모용으로 프롬프트에 고정되어 있습니다.
- `VITE_` 로 시작하는 환경 변수는 브라우저에 노출됩니다. 학습용이 아니라면 나중에 서버에서 API를 호출하는 방식을 권장합니다.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 |
