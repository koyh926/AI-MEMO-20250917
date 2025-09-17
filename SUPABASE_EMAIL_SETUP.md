# Supabase 이메일 인증 설정 가이드

## 문제 해결을 위한 Supabase 설정 확인

회원가입 인증메일이 동작하지 않는 문제를 해결하기 위해 다음 설정을 확인해주세요.

### 1. Supabase 대시보드 접속
- [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
- 프로젝트 선택: `rupwtzzqbldsufgxxvlr`

### 2. Authentication 설정 확인

#### 2.1 Email Settings
1. **Authentication** → **Settings** → **Email** 이동
2. 다음 설정 확인:
   - ✅ **Enable email confirmations**: 활성화되어 있는지 확인
   - ✅ **Enable email change confirmations**: 활성화되어 있는지 확인
   - ✅ **Enable email change confirmations**: 활성화되어 있는지 확인

#### 2.2 SMTP Settings (중요!)
1. **Authentication** → **Settings** → **SMTP Settings** 이동
2. 다음 중 하나를 설정:

**옵션 1: Supabase 기본 SMTP 사용 (권장)**
- ✅ **Enable custom SMTP**: 비활성화 (기본값)
- Supabase의 기본 이메일 서비스를 사용

**옵션 2: 커스텀 SMTP 설정**
- ✅ **Enable custom SMTP**: 활성화
- 다음 정보 입력:
  - **Host**: SMTP 서버 주소
  - **Port**: 587 (TLS) 또는 465 (SSL)
  - **Username**: 이메일 주소
  - **Password**: 앱 비밀번호
  - **Sender name**: "Andrew's 메모 관리"
  - **Sender email**: 발신자 이메일

### 3. Email Templates 설정

#### 3.1 Confirm signup template
1. **Authentication** → **Email Templates** → **Confirm signup** 이동
2. 다음 설정 확인:
   - **Subject**: "Andrew's 메모 관리 이메일 인증"
   - **Body**: HTML 템플릿에 다음 포함:
     ```html
     <h2>Andrew's 메모 관리 이메일 인증</h2>
     <p>회원가입을 완료하려면 아래 링크를 클릭하세요:</p>
     <a href="{{ .ConfirmationURL }}">이메일 인증하기</a>
     <p>링크가 작동하지 않으면 다음 URL을 복사하여 브라우저에 붙여넣으세요:</p>
     <p>{{ .ConfirmationURL }}</p>
     ```

### 4. Site URL 설정

#### 4.1 Site URL 확인
1. **Authentication** → **Settings** → **General** 이동
2. **Site URL** 설정:
   - 개발환경: `http://localhost:3000`
   - 프로덕션: `https://yourdomain.com`

#### 4.2 Redirect URLs 확인
1. **Authentication** → **Settings** → **General** 이동
2. **Redirect URLs**에 다음 추가:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

### 5. Rate Limiting 설정

#### 5.1 Email Rate Limiting
1. **Authentication** → **Settings** → **Rate Limiting** 이동
2. **Email rate limiting** 설정:
   - **Max emails per hour**: 30 (기본값)
   - **Max emails per day**: 100 (기본값)

### 6. 테스트 방법

#### 6.1 개발 서버 실행
```bash
pnpm dev
```

#### 6.2 회원가입 테스트
1. `http://localhost:3000/signup` 접속
2. 유효한 이메일 주소로 회원가입 시도
3. 이메일 인증 페이지로 리다이렉트되는지 확인

#### 6.3 이메일 확인
1. 이메일 수신함 확인 (스팸 메일함 포함)
2. 이메일이 오지 않으면 재발송 기능 사용
3. 이메일 링크 클릭하여 인증 완료

### 7. 디버깅

#### 7.1 서버 로그 확인
개발 서버 콘솔에서 다음 로그 확인:
```
회원가입 시도: { email: "test@example.com", redirectUrl: "..." }
회원가입 결과: { data: {...}, error: null }
```

#### 7.2 Supabase 로그 확인
1. Supabase 대시보드 → **Logs** → **Auth** 이동
2. 회원가입 시도 시 로그 확인
3. 에러 메시지가 있는지 확인

### 8. 일반적인 문제 해결

#### 8.1 이메일이 오지 않는 경우
- 스팸 메일함 확인
- 이메일 주소 오타 확인
- SMTP 설정 확인
- Rate limiting 확인

#### 8.2 인증 링크가 작동하지 않는 경우
- Site URL 설정 확인
- Redirect URLs 설정 확인
- 이메일 템플릿의 링크 형식 확인

#### 8.3 개발환경에서 이메일 테스트
- Gmail, Outlook 등 실제 이메일 서비스 사용
- 테스트 이메일 서비스 (Mailtrap, MailHog) 사용 고려

### 9. 추가 도움

문제가 지속되면:
1. Supabase 공식 문서: https://supabase.com/docs/guides/auth
2. Supabase 커뮤니티: https://github.com/supabase/supabase/discussions
3. 프로젝트 로그 확인 및 에러 메시지 수집
