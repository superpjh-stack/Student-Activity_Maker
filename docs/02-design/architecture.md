# 아키텍처 설계서

## 기술스택

| 구분 | 기술 | 버전/비고 |
|------|------|-----------|
| 프레임워크 | Next.js 14 | App Router |
| 언어 | TypeScript | strict mode |
| 스타일링 | Tailwind CSS | utility-first |
| AI API | OpenAI SDK | gpt-4o |
| 런타임 | Node.js | v18+ |

## 폴더 구조

```
Student-Activity-Maker/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 루트 레이아웃 (한국어, Tailwind)
│   │   ├── page.tsx            # 메인 페이지 (과목 선택)
│   │   ├── globals.css         # 글로벌 스타일
│   │   ├── [subject]/
│   │   │   └── page.tsx        # 주제 선택 페이지
│   │   ├── generate/
│   │   │   └── page.tsx        # 보고서 옵션 폼 + 생성
│   │   ├── history/
│   │   │   ├── page.tsx        # 생성 이력 목록
│   │   │   └── [id]/
│   │   │       └── page.tsx    # 이력 상세 보기
│   │   └── api/
│   │       ├── generate-report/
│   │       │   └── route.ts    # 탐구보고서 생성 API
│   │       └── generate-setech/
│   │           └── route.ts    # 세특 500자 생성 API
│   ├── components/
│   │   ├── ui/
│   │   │   ├── SubjectCard.tsx  # 과목 카드 컴포넌트
│   │   │   └── CopyButton.tsx   # 복사 버튼 컴포넌트
│   │   └── features/
│   │       └── ResultDisplay.tsx # 보고서/세특 결과 표시
│   ├── lib/
│   │   ├── ai.ts                # OpenAI 클라이언트 + 프롬프트
│   │   ├── subjects.ts          # 과목/주제 데이터
│   │   ├── topics-cache.ts      # 주제 일일 캐시
│   │   ├── history.ts           # 생성 이력 관리
│   │   └── docx-export.ts       # DOCX 내보내기
│   └── types/
│       └── index.ts             # 타입 정의
├── docs/
├── public/
├── .env.local                   # 환경변수 (git 제외)
├── .env.local.example           # 환경변수 예시
├── CLAUDE.md
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 데이터 흐름도

```
[사용자]
  │
  ▼
[메인 페이지 (page.tsx)] ──── Server Component
  │
  ▼
[SubjectCard] ──── Client Component (components/ui/)
  │  과목 선택 (8개)
  ▼
[/[subject]/page.tsx] ──── 주제 선택 (인라인)
  │  주제 선택 (과목당 5개)
  ▼
[/generate/page.tsx] ──── 보고서 옵션 폼 (인라인)
  │  길이/톤 옵션 설정
  │
  ├──────────────────────────────────┐
  ▼                                  ▼
[POST /api/generate-report]    [POST /api/generate-setech]
  │                                  │
  ▼                                  ▼
[OpenAI SDK]                   [OpenAI SDK]
  │  gpt-4o                          │  gpt-4o
  ▼                                  ▼
[ResultDisplay] ──── Client Component (components/features/)
  │  탐구보고서 + 세특 500자 표시
  ▼
[사용자] ──── 복사/다운로드
```

## 환경변수 목록

| 변수명 | 설명 | 필수 | 기본값 |
|--------|------|------|--------|
| `OPENAI_API_KEY` | OpenAI API 인증 키 | Yes | - |
