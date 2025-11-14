# 🔑 API 키 관리 시스템

API 키의 유효성을 검증하고 프로젝트 내 사용 위치를 추적하여 사용하지 않는 키를 쉽게 정리할 수 있는 종합 관리 시스템입니다.

## 📋 주요 기능

### 1. API 키 관리
- ✅ 여러 개의 API 키 등록 및 관리
- 🏷️ 키 이름, 타입, 설명, 사용 위치 기록
- 💾 LocalStorage를 사용한 영구 저장
- 🔒 API 키 마스킹 (보안)
- 📋 클립보드 복사 기능

### 2. 유효성 검증
- ✓ 실제 API 호출을 통한 키 유효성 검증
- 🤖 Google Gemini, OpenAI, Anthropic Claude 지원
- 🔄 개별 검증 또는 일괄 검증
- 🎨 시각적 상태 표시 (유효/무효/미검증)

### 3. 사용 위치 추적
- 🔍 프로젝트 내 모든 파일 스캔
- 📍 API 키가 사용되는 정확한 파일과 라인 번호 추적
- ⚠️ 미사용 키 자동 식별
- 📊 통계 대시보드

### 4. 데이터 관리
- 📤 키 목록 내보내기 (JSON)
- 📥 스캔 결과 가져오기
- 🗑️ 개별 키 삭제

## 🚀 사용 방법

### 1. 설치

```bash
# Node.js 의존성 설치 (스캔 기능 사용 시)
npm install
```

### 2. 웹 페이지 실행

브라우저에서 `api-key-manager.html`을 열거나 라이브 서버로 실행:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server
```

그런 다음 브라우저에서 `http://localhost:8000/api-key-manager.html`에 접속합니다.

### 3. API 키 추가

1. 왼쪽 패널의 폼에 정보 입력:
   - **키 이름**: 키를 식별할 수 있는 이름 (예: "Production Gemini Key")
   - **API 키 값**: 실제 API 키
   - **API 타입**: Gemini, OpenAI, Claude 등
   - **설명**: 키의 용도 (선택사항)
   - **사용 위치**: 알고 있는 사용 위치 (선택사항)

2. "➕ API 키 추가" 버튼 클릭

### 4. 키 유효성 검증

#### 개별 검증
각 키 카드의 "✓ 유효성 검증" 버튼을 클릭하여 해당 키가 실제로 작동하는지 확인합니다.

#### 일괄 검증
오른쪽 패널 상단의 "🔍 모든 키 유효성 검증 실행" 버튼을 클릭하여 모든 키를 한 번에 검증합니다.

### 5. 사용 위치 스캔 (핵심 기능!)

#### Step 1: 키 목록 내보내기
1. 왼쪽 패널 하단의 "⚙️ 도구" 섹션에서
2. "📤 키 목록 내보내기 (스캔용)" 버튼 클릭
3. `registered-keys.json` 파일이 다운로드됨
4. 이 파일을 프로젝트 루트에 저장

#### Step 2: 스캔 실행
터미널에서 다음 명령어 실행:

```bash
npm run scan
```

스캔이 완료되면 다음과 같은 정보를 확인할 수 있습니다:
- 📁 스캔한 파일 수
- 🔑 발견한 API 키 수
- 📍 총 사용 위치 수
- ⚠️ 사용되지 않는 키 목록

결과는 `api-keys-usage.json` 파일로 저장됩니다.

#### Step 3: 결과 가져오기
1. 웹 페이지로 돌아가서
2. "📥 스캔 결과 가져오기" 버튼 클릭
3. `api-keys-usage.json` 파일 선택
4. 각 키의 사용 위치가 자동으로 업데이트됨

### 6. 미사용 키 정리

1. 스캔 후 노란색 배경으로 표시된 카드가 미사용 키입니다
2. 통계 대시보드에서 "미사용 키" 숫자 확인
3. 사용하지 않는 키는 "🗑️ 삭제" 버튼으로 제거

## 📂 파일 구조

```
API-Test/
├── index.html              # Gemini API 테스트 페이지
├── api-key-manager.html    # API 키 관리 시스템
├── scan-api-keys.js        # Node.js 스캔 스크립트
├── package.json            # Node.js 프로젝트 설정
├── .gitignore              # Git 제외 파일 목록
├── README.md               # 이 문서
├── registered-keys.json    # 내보낸 키 목록 (gitignore됨)
└── api-keys-usage.json     # 스캔 결과 (gitignore됨)
```

## 🔍 스캔 스크립트 상세

### 기능
- 프로젝트 내 모든 파일을 재귀적으로 검색
- 등록된 API 키 패턴 매칭
- 미등록 API 키 자동 발견
- 파일 경로와 라인 번호 추적
- 상세한 통계 정보 제공

### 설정 옵션

`scan-api-keys.js` 파일의 `CONFIG` 객체에서 다음을 설정할 수 있습니다:

```javascript
const CONFIG = {
    // 검색할 파일 확장자
    extensions: ['.html', '.js', '.ts', '.jsx', '.tsx', '.json', '.env', '.yml', '.yaml', '.txt', '.md'],

    // 제외할 디렉토리
    excludeDirs: ['.git', 'node_modules', 'dist', 'build', '.cache'],

    // 제외할 파일
    excludeFiles: ['scan-api-keys.js', 'api-keys-usage.json'],

    // 최대 파일 크기 (10MB)
    maxFileSize: 10 * 1024 * 1024
};
```

### 수동 실행

```bash
# 기본 실행
node scan-api-keys.js

# 또는 npm 스크립트로
npm run scan

# watch 모드 (파일 변경 시 자동 재실행)
npm run scan:watch
```

## 🎨 사용 예시

### 시나리오: 프로젝트 정리

1. **현재 상태 파악**
   - 10개의 API 키가 등록되어 있음
   - 어떤 키가 실제로 사용되는지 불확실

2. **검증 및 스캔**
   ```bash
   # 1. 웹 페이지에서 모든 키 유효성 검증
   # 2. 키 목록 내보내기
   # 3. 스캔 실행
   npm run scan
   # 4. 결과 가져오기
   ```

3. **결과**
   - ✅ 유효한 키: 8개
   - ❌ 무효한 키: 2개 → 삭제
   - ⚠️ 미사용 키: 3개 → 검토 후 삭제
   - ✓ 실사용 키: 5개 → 유지

4. **정리 완료**
   - 최종 5개의 유효하고 사용 중인 키만 유지
   - 각 키의 사용 위치가 명확히 문서화됨

## 🛡️ 보안 주의사항

1. **API 키 노출 방지**
   - `registered-keys.json`과 `api-keys-usage.json`은 `.gitignore`에 포함됨
   - 절대 Git에 커밋하지 마세요!

2. **브라우저 저장소**
   - API 키는 브라우저의 LocalStorage에 저장됨
   - 공용 컴퓨터에서는 사용 후 데이터를 삭제하세요

3. **키 관리 권장사항**
   - 주기적으로 키 유효성 검증
   - 미사용 키는 즉시 삭제
   - 프로덕션 환경에서는 환경 변수 사용 권장

## 🔧 문제 해결

### 스캔이 작동하지 않음

**문제**: `npm run scan` 실행 시 오류 발생

**해결**:
```bash
# Node.js 설치 확인
node --version

# 의존성 재설치
rm -rf node_modules
npm install

# 스크립트 권한 확인 (Linux/Mac)
chmod +x scan-api-keys.js
```

### 스캔 결과를 가져올 수 없음

**문제**: "올바른 스캔 결과 파일이 아닙니다" 오류

**해결**:
1. `api-keys-usage.json` 파일이 프로젝트 루트에 있는지 확인
2. 스캔을 다시 실행했는지 확인
3. JSON 파일이 손상되지 않았는지 확인

### API 키 검증 실패

**문제**: 유효한 키인데 검증이 실패함

**해결**:
1. API 사용량 한도 확인
2. 네트워크 연결 확인
3. CORS 문제인 경우 로컬 서버로 실행

## 📊 지원하는 API

현재 다음 API의 유효성 검증을 지원합니다:

- ✅ Google Gemini API
- ✅ OpenAI API
- ✅ Anthropic Claude API
- ⚙️ 기타 (기본 패턴 매칭)

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요!

## 📄 라이선스

MIT License

---

**만든이**: Claude AI Assistant
**버전**: 1.0.0
**최종 업데이트**: 2024
