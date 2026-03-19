# Plan: 탐구보고서 참고문헌 출처 리스트 (F-15)

## Feature ID
`report-sources`

## 목표
탐구보고서 생성 완료 후, 보고서 하단에 **참고문헌 섹션**을 별도로 표시한다.
각 항목은 클릭 시 관련 학술 검색 페이지(RISS, Google Scholar, NAVER 학술정보)로 이동한다.

## 문제 정의
- 현재 생성된 탐구보고서는 AI가 작성한 내용만 있고, 학생이 실제로 참고할 수 있는 출처가 없음
- 탐구보고서의 신뢰도와 학술적 완성도를 높이려면 참고문헌이 필요
- AI(GPT-4o)는 실시간 웹 검색 불가 → 실제 URL 대신 "검색 가능한 키워드 + 검색 링크 자동 생성" 방식 채택

## 해결 방안
1. 보고서 스트리밍 완료 후, 별도 API `/api/generate-sources`를 호출
2. GPT-4o가 해당 탐구 주제와 관련된 **참고문헌 후보 3~5개**를 JSON으로 반환
   - 논문/자료 제목 (한국어)
   - 저자/출처 기관 (추정)
   - 발행연도 (추정)
   - 검색 키워드
3. 각 항목에 대해 3개의 검색 링크를 자동 생성:
   - 🔍 RISS (한국교육학술정보원)
   - 📚 Google Scholar
   - 📰 NAVER 학술정보
4. 결과 UI: `ResultDisplay` 하단 "📚 참고문헌" 섹션으로 표시

## 기술 범위

### 새 파일
- `src/app/api/generate-sources/route.ts` — 참고문헌 생성 API
- `src/components/features/SourceList.tsx` — 참고문헌 UI 컴포넌트

### 수정 파일
- `src/lib/ai.ts` — `generateSources()` 함수 추가
- `src/app/generate/page.tsx` — 스트리밍 완료 후 출처 로딩 호출
- `src/types/index.ts` — `Source`, `SourceItem` 타입 추가

## 데이터 구조

```typescript
export interface SourceItem {
  title: string;      // 논문/자료 제목
  author?: string;    // 저자/기관
  year?: string;      // 발행연도
  keyword: string;    // 검색 키워드 (URL 인코딩용)
}
```

## UX 흐름

```
[탐구보고서 스트리밍 완료]
        ↓
[출처 로딩 중... 스피너 표시]
        ↓
[📚 참고문헌 섹션 표시]
- [1] 제목 — 저자 (연도)
     [RISS] [Google Scholar] [NAVER 학술]
- [2] ...
- [3] ...
```

## 검색 URL 패턴

```
RISS:          https://www.riss.kr/search/Search.do?searchGubun=all&query={keyword}
Google Scholar: https://scholar.google.com/scholar?q={keyword}
NAVER 학술:    https://academic.naver.com/search.naver?query={keyword}
```

## 우선순위
**High** — 탐구보고서의 학술적 완성도를 즉각 높여주는 핵심 기능

## 범위 제외 (Out of Scope)
- 실제 논문 URL 직접 링크 (AI 환각 위험)
- 출처 수동 추가/편집
- PDF 인쇄 시 참고문헌 포함 (추후 고려)

## 완료 조건
- [ ] 보고서 생성 완료 후 3~5개 참고문헌 자동 생성
- [ ] 각 항목에 3개 검색 링크 버튼 표시
- [ ] 링크 클릭 시 새 탭으로 열림
- [ ] 로딩 중 스피너 표시
- [ ] 출처 없을 시 섹션 미표시 (graceful)
- [ ] 스트리밍 A/B 비교 모드에서도 동작

## 예상 작업량
- API 라우트: 30분
- ai.ts 함수: 30분
- SourceList 컴포넌트: 30분
- generate/page.tsx 연동: 30분
- **Total: ~2시간**

## 작성일
2026-03-19
