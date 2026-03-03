# 06. Submission Checklist

## 제출 링크
- https://airtable.com/appgJctAaKPFkMKrW/pagPPG1kBRC0C54w6/form

## 1) 필수 아티팩트

- [ ] Public GitHub repo (최종 공개 전 점검 필요)
- [x] 3~5분 데모 영상 (`submission/demo-video.mp4`)
- [x] README (문제/해결/아키텍처/CRE 사용 설명 — 실제 Polymarket 사례 기반)
- [x] 프로젝트 설명(트랙 적합성)

## 2) README 포함 항목

- [x] 문제 정의 (실제 Polymarket 논란 3건: Ukraine $7M, Zelenskyy $237M, Fort Knox $3.5M)
- [x] 해결 방식 (quality-weighted source analysis + policy gates)
- [x] 시스템 아키텍처 (5-layer: Evidence → AI → Policy → CRE → Audit)
- [x] CRE 역할 설명
- [x] 실행 방법 (로컬 재현 커맨드 포함)
- [x] 데모 영상 파일
- [ ] 제출 폼/README용 외부 데모 영상 링크
- [x] 사용 기술/아티팩트 명세
- [x] On-chain 아키텍처 (Chainlink Price Feed + IgrRegistry.sol)

## 3) 기술 검증

- [x] replay report 생성 (6 케이스 × 3 체크포인트)
- [x] case manifest 생성
- [x] replay package summary/checksum 생성
- [x] `npm test` green (9/9)
- [x] 실패/보류 경로 시연 (Case-B HOLD, Ukraine HOLD, Zelenskyy HOLD)
- [x] 실제 Polymarket 논란 케이스 replay 가능
- [x] Live Chainlink evaluation 동작 확인

## 4) 영상 가이드

- [x] 5분 초과 금지 확인
- [x] 문제 → 데모 → 차별점 → 마무리 스크립트 작성
- [x] 실제 케이스 기반 내러티브 (Ukraine deal + Zelenskyy suit)
- [ ] 최종 영상 품질 검수

## 5) 규정 준수

- [ ] 해커톤 기간 작업분 증빙 (커밋 정리 필요)
- [ ] 팀원 전원 등록 확인
- [ ] 코드/에셋 라이선스 표기
- [ ] KYC 가능성 고려

## 6) 마감 운영

- [x] KST 기준 마감 시각 재확인 (2026-03-02 13:59)
- [ ] 마감 12시간 전 예비 제출
- [ ] 최종 제출 후 링크 유효성 점검

## 7) 최종 재현 커맨드

```bash
npm install
npm test
npm run replay -- --case=simulation/input/replay/case-ukraine-deal --policy=configs/policy.v1.json --out=simulation/output/reports
npm run replay -- --case=simulation/input/replay/case-zelenskyy-suit --policy=configs/policy.v1.json --out=simulation/output/reports
npm run replay -- --case=simulation/input/replay/case-a --policy=configs/policy.v1.json --out=simulation/output/reports
npm run replay -- --case=simulation/input/replay/case-b --policy=configs/policy.v1.json --out=simulation/output/reports
npm run replay:package -- --reports=simulation/output/reports --out=simulation/output/replay-package
npm run live
npm run score
```
