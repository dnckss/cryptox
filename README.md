# cryptoX

모의 암호화폐 거래 플랫폼

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트를 생성하세요.
2. Supabase 대시보드에서 프로젝트 URL과 Anon Key를 확인하세요.
3. `.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 소셜 로그인 설정

Supabase 대시보드에서 다음 소셜 로그인 프로바이더를 설정하세요:
- Google
- Apple
- Kakao

각 프로바이더의 OAuth 클라이언트 ID와 Secret을 Supabase에 설정해야 합니다.

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
