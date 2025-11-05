# cryptoX

모의 암호화폐 거래 플랫폼

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# CoinGecko API (선택사항, 무료 계정 사용 가능)
# API 키가 없어도 사용 가능하지만, rate limit이 더 낮습니다.
# API 키 발급: https://www.coingecko.com/en/api
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_api_key
```

#### Supabase 설정
1. [Supabase](https://supabase.com)에서 프로젝트를 생성하세요.
2. Supabase 대시보드에서 프로젝트 URL과 Anon Key를 확인하세요.

#### CoinGecko API 설정 (선택사항)
1. [CoinGecko API](https://www.coingecko.com/en/api)에서 무료 API 키를 발급받으세요.
2. 무료 계정: 월간 10,000회, 분당 30회 호출 제한
3. API 키 없이도 사용 가능하지만, rate limit이 더 낮습니다.
4. API 호출 최적화:
   - 데이터 캐싱 (60초)
   - 여러 코인을 한 번에 요청
   - 필요한 데이터만 요청

### 3. 소셜 로그인 설정

Supabase 대시보드에서 다음 소셜 로그인 프로바이더를 설정하세요:
- Google
- Apple
- Kakao

각 프로바이더의 OAuth 클라이언트 ID와 Secret을 Supabase에 설정해야 합니다.

#### Redirect URL 설정 (중요!)

**Supabase 대시보드** → **Authentication** → **URL Configuration**에서 다음을 설정하세요:

1. **Site URL**: 
   - 프로덕션: `https://your-app.vercel.app`
   - 또는 기본값 유지

2. **Redirect URLs**에 다음을 모두 추가:
   ```
   http://localhost:3000/auth/callback
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/**
   ```

**각 OAuth Provider (Google, Apple, Kakao) 설정에서도 Redirect URI를 추가해야 합니다:**
- Google Cloud Console: `http://localhost:3000/auth/callback` 및 Vercel 도메인 추가
- Apple Developer: Redirect URI 설정 확인
- Kakao Developers: Redirect URI 설정 확인

⚠️ **로컬 개발 시 로그인이 안 되는 경우**: Supabase 대시보드의 Redirect URLs에 `http://localhost:3000/auth/callback`이 추가되어 있는지 확인하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 기술 스택

- **Next.js 16** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **Supabase** - 인증 및 백엔드
- **CoinGecko API** - 실시간 암호화폐 가격 데이터

## API 호출 최적화

CoinGecko API 무료 계정의 제한(월간 10,000회)을 효율적으로 사용하기 위해:

1. **캐싱**: Next.js의 `fetch` 캐싱을 활용하여 60초간 데이터를 캐시합니다.
2. **배치 요청**: 여러 코인을 한 번에 요청하여 API 호출 횟수를 최소화합니다.
3. **필요한 데이터만 요청**: 각 엔드포인트에서 필요한 데이터만 가져옵니다.
4. **서버 사이드 렌더링**: API 호출을 서버 사이드에서 처리하여 클라이언트 요청을 최소화합니다.

## 주요 기능

- 실시간 코인 가격 조회
- 코인 상세 정보 및 차트
- 구매/판매 인터페이스
- 포트폴리오 요약
- 거래 내역 확인
