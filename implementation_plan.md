# 면접 도우미 웹사이트 구현 계획

## Goal Description
웹 환경에서 면접관과 대기자가 실시간으로 현재 진행 중인 면접 순서와 시간을 확인할 수 있는 대시보드('면접 대기열 탭')를 구축합니다. Google Sheets를 백엔드(DB)로 활용하여, 면접 일정과 명단을 관리하고 웹에서 이를 읽어와(Read-only) UI에 최적화하여 렌더링합니다. 프로젝트는 Next.js (React) 기반으로 구현하며, 세련되고 생동감 있는 디자인을 적용합니다.

## User Review Required
> [!IMPORTANT]  
> Google Sheets API 연동을 위해 **스프레드시트 ID(Spreadsheet ID)**와 **API 키(API Key)**가 필요합니다. 사용자가 직접 GCP 설정 및 시트 권한 공유를 진행해야 합니다.

## Proposed Changes
### Frontend App Structure
- **Next.js App Router**: 최신 App Router 방식을 사용하여 `/` 경로에 면접 대기열 탭을 구성합니다.
- **Tailwind CSS**: 전역 스타일을 구축하고 모던하고 프리미엄한 UI를 구성합니다.

### Google Sheets API Integration
- `src/utils/sheets.ts` (예정): 서버(또는 클라이언트) 측에서 `fetch`를 이용하여 Google Sheets API (v4)를 호출합니다.
- 데이터 갱신: 주기적으로 데이터(면접자 명단)를 재요청하거나, 클라이언트에서 일정 주기로 최신화하여 화면의 시간대와 DB를 동기화합니다.

## Verification Plan
### Manual Verification
1. 데이터 파싱 확인: 7분 단위, 15분 단위 등 구글 시트의 시간을 웹에서 올바르게 현재 시간 객체(`Date` 등)로 파싱하는지 확인합니다.
2. 현재 면접 필터링: (현재 기기 시간) >= (시작 시간) && (현재 기기 시간) < (종료 시간) 조건에 해당하는 사람이 올바르게 UI 상단에 노출되는지 확인합니다.
3. 디자인 리뷰: 비어있는 시간('X')은 어떻게 보여줄지 시각적 처리를 점검합니다.
