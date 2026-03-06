# grade-topics Design Document

## Feature: 학년별 탐구보고서 주제 은행 (Grade-Based Topic Bank)

- **Date**: 2026-03-06
- **Plan References**: grade10-topic-bank.plan.md, grade2-topic-bank.plan.md, grade3-topics-curation.plan.md
- **Level**: Dynamic
- **Status**: Design Phase

---

## 1. Overview

현재 앱은 과목별 10개 주제 풀을 보유하나 **학년 구분이 없다**. 고1/고2/고3 학생의 교육과정 수준·입시 전략이 다르므로, 학년별 맞춤 주제 풀을 제공하여 세특 임팩트를 극대화한다.

### 변경 범위

| 항목 | Before | After |
|------|--------|-------|
| 주제 풀 크기 | 과목당 10개 (학년 구분 없음) | 과목당 20개 (학년별 1학기 5 + 2학기 5) |
| 학년 선택 | 없음 | 홈/과목 선택 전 학년 선택 단계 추가 |
| 주제 데이터 위치 | `subjects.ts` topics 배열 | `grade-topics.ts` 별도 파일로 분리 |
| 캐시 키 | `saenggibu_daily_topics` | `saenggibu_daily_topics_v2` (학년 포함) |
| 학기 표시 | 없음 | 주제 선택 시 1학기/2학기 배지 표시 |

---

## 2. Data Model

### 2-1. 타입 추가 (`src/types/index.ts`)

```typescript
export type Grade = 'grade1' | 'grade2' | 'grade3';
export type Semester = 'sem1' | 'sem2';

export interface GradeTopic {
  topic: string;
  semester: Semester;
  career: string;        // 진로 연계 (예: "의대·보건의료정보")
  differentiator?: string; // 고3만 사용: 차별화 포인트
}

export interface GradeSubjectTopics {
  subjectId: string;
  grade: Grade;
  topics: GradeTopic[];  // 10개 (1학기 5 + 2학기 5)
}
```

기존 `Subject.topics: string[]` 유지 — 학년 선택 안 했을 때 fallback용.

### 2-2. 신규 데이터 파일 (`src/lib/grade-topics.ts`)

구조:
```typescript
// 과목 5개 × 학년 3개 × 주제 10개 = 150개
export const GRADE_TOPICS: Record<Grade, Record<string, GradeTopic[]>> = {
  grade1: {
    math: [...],      // 10개
    physics: [...],
    chemistry: [...],
    biology: [...],
    ethics: [...],    // 생활과윤리 (신규 과목 ID)
  },
  grade2: { ... },
  grade3: { ... },
};
```

**대상 과목 5개**: math, physics, chemistry, biology, `ethics`(생활과윤리 신규)
- `ethics`는 `subjects.ts`에 신규 추가 필요

### 2-3. 캐시 키 변경 (`src/lib/topics-cache.ts`)

```typescript
// 학년 포함 캐시 키
const CACHE_KEY_V2 = 'saenggibu_daily_topics_v2';

// 기존 함수에 grade 파라미터 오버로드 추가
export function getDailyTopicsForGrade(
  subjectId: string,
  grade: Grade,
  allTopics: GradeTopic[]
): GradeTopic[]
```

캐시 구조 변경:
```typescript
interface DailyCache {
  date: string;
  grade: Grade;  // 추가
  subjects: Record<string, { offset: number; topics: GradeTopic[] }>;
}
```

---

## 3. UI Flow

### 3-1. 학년 선택 단계 추가

```
현재 플로우:
홈(/) → 과목 선택(/subjects) → 주제 입력(/[subject]/generate)

변경 플로우:
홈(/) → 학년 선택(/grade) → 과목 선택(/subjects?grade=X) → 주제 입력(/[subject]/generate)
```

- `/grade` 페이지: 고1/고2/고3 선택 카드 3개
- 선택한 학년은 `localStorage('sam_grade')` 또는 URL 파라미터로 전달
- 학년 선택 안 하면 기존 subjects.ts 주제 사용 (하위 호환)

### 3-2. `/grade` 페이지 컴포넌트 설계

```
GradeSelectPage
├── 페이지 헤더: "학년을 선택해주세요"
├── GradeCard × 3
│   ├── grade1: "고1" + 특징 태그 (기초 탐구, 개념 중심)
│   ├── grade2: "고2" + 특징 태그 (심화 탐구, 데이터 분석)
│   └── grade3: "고3" + 특징 태그 (입시 직결, 면접 연계)
└── "학년 무관" 버튼 (기존 주제 사용)
```

### 3-3. 주제 선택 시 학기 배지 표시

과목 선택 후 주제 목록에서:
```
[1학기] 베이즈 정리와 의료 진단 정확도 분석 | 의대·보건의료
[2학기] 미분방정식 SIR 모델로 전염병 검증  | 수리생물학
```

배지 색상:
- 1학기: `bg-blue-100 text-blue-700`
- 2학기: `bg-violet-100 text-violet-700`

### 3-4. 홈 페이지 수정

기존 "바로 시작하기" CTA → "학년 선택하기"로 변경 또는 홈에서 바로 학년 카드 표시.

---

## 4. 신규 과목: 생활과윤리 (ethics)

`subjects.ts`에 추가:
```typescript
{
  id: 'ethics',
  name: '생활과윤리',
  emoji: '⚖️',
  color: 'teal',
  topics: [],  // grade-topics.ts에서 제공, 여기선 빈 배열 (fallback)
}
```

---

## 5. 구현 파일 목록

| 파일 | 작업 | 우선순위 |
|------|------|---------|
| `src/types/index.ts` | Grade, Semester, GradeTopic 타입 추가 | P0 |
| `src/lib/grade-topics.ts` | 150개 주제 데이터 (신규) | P0 |
| `src/lib/topics-cache.ts` | getDailyTopicsForGrade 함수 추가 | P0 |
| `src/lib/subjects.ts` | ethics 과목 추가 | P1 |
| `src/app/grade/page.tsx` | 학년 선택 페이지 (신규) | P1 |
| `src/app/subjects/page.tsx` | grade 파라미터 수신 + 학년별 주제 사용 | P1 |
| `src/components/GradeCard.tsx` | 학년 선택 카드 컴포넌트 (신규) | P1 |
| `src/app/page.tsx` | CTA 링크 → /grade 로 변경 | P2 |
| `src/app/[subject]/generate/page.tsx` | 학기 배지 표시 | P2 |

---

## 6. 하위 호환 전략

- 기존 `/subjects` 직접 접근 시 → grade 파라미터 없음 → 기존 `subjects.ts` 주제 사용
- localStorage `sam_grade` 없으면 학년 선택 페이지로 redirect
- 기존 history 데이터에 grade 없음 → 표시 시 "학년 미지정" 처리

---

## 7. 구현 순서 (Do Phase)

1. `src/types/index.ts` — Grade, Semester, GradeTopic 타입 추가
2. `src/lib/grade-topics.ts` — 150개 주제 데이터 작성 (math/physics/chemistry/biology/ethics × grade1/2/3)
3. `src/lib/topics-cache.ts` — getDailyTopicsForGrade 추가
4. `src/lib/subjects.ts` — ethics 과목 추가
5. `src/components/GradeCard.tsx` — 학년 선택 카드
6. `src/app/grade/page.tsx` — 학년 선택 페이지
7. `src/app/subjects/page.tsx` — grade 연동
8. `src/app/[subject]/generate/page.tsx` — 학기 배지 추가
9. `src/app/page.tsx` — CTA 링크 수정
