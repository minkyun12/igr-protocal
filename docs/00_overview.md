# 00. Chainlink Convergence Hackathon 2026 — 종합 정리

> 최종 업데이트: 2026-02-24 (공식 사이트 재확인)
> 출처: https://chain.link/hackathon, /prizes, /schedule, /faq

---

## A. 핵심 일정

| 날짜 | 이벤트 | 비고 |
|------|--------|------|
| **Feb 6** | 해커톤 시작 | 이 날부터 작업분만 인정 |
| Feb 9–17 | 워크숍 | YouTube 라이브 |
| Feb 17–Mar 3 | 오피스아워 & 멘토링 | Discord |
| **Mar 8, 11:59 PM ET** | **제출 마감** | **= 3/9 13:59 KST** |
| **Mar 27, 12:00 PM ET** | 수상 발표 | = 3/28 02:00 KST |

> ⚠️ 이전 기록(Mar 1 마감)에서 **Mar 8로 1주일 연장**됨

---

## B. 상금 구조

### 메인 트랙

| 트랙 | 1st | 2nd | 합계 |
|------|-----|-----|------|
| DeFi & Tokenization | $12,000 | $8,000 | $20,000 |
| **CRE & AI** | **$10,500** | **$6,500** | **$17,000** |
| **Prediction Markets** | **$10,000** | **$6,000** | **$16,000** |
| **Risk & Compliance** | **$10,000** | **$6,000** | **$16,000** |
| Privacy | $10,000 | $6,000 | $16,000 |
| Autonomous Agents (신규, Moltbook 전용) | $3,500 | $1,500 | $5,000 |
| Top 10 Projects | $1,500 × 10 | | $15,000 |

**메인 트랙 합계: $105,000**

### 파트너 트랙

| 트랙 | 1st | 2nd | 3rd | 합계 |
|------|-----|-----|-----|------|
| Best use of World ID + CRE | $3,000 | $1,500 | $500 | $5,000 |
| Best CRE in World Mini App | $3,000 | $1,500 | $500 | $5,000 |
| Tenderly Virtual TestNets | $2,500 | $1,750 | $750 | $5,000 |
| thirdweb × CRE | Scale plan | Growth plan | Growth plan | 인카인드 |

**파트너 현금 합계: $15,000**
**전체 현금 합계: $120,000+**

---

## C. 공통 제출 요구사항 (모든 트랙 동일)

### 필수 항목 5가지

1. **CRE Workflow 빌드/시뮬레이션/배포**
   - CRE를 프로젝트의 **오케스트레이션 레이어**로 사용
   - 최소 1개 블록체인 + 1개 외부 연동 (API, 데이터소스, LLM, AI 에이전트)
   - **CRE CLI 시뮬레이션 성공** 또는 **CRE 네트워크 라이브 배포** 증빙 필요

2. **3~5분 데모 영상**
   - publicly viewable (YouTube unlisted 등)
   - 워크플로우 실행 또는 CLI 시뮬레이션 장면 포함

3. **Public GitHub 레포**

4. **README에 Chainlink 사용 파일 링크**

5. **해커톤 기간(2/6~) 작업분이 핵심**
   - 기존 프로젝트 확장 가능하지만, 신규 컴포넌트 증빙 필요
   - 과거 동일 제출물 재출품 불가

### 프론트엔드/호스팅

- 프론트엔드 **필수 아님**
- 외부 호스팅 **필수 아님** (로컬 데모 가능)

---

## D. CRE 기술 요구사항 상세

### CRE CLI 설치

```bash
# 자동 설치 (macOS/Linux)
curl -sSL https://cre.chain.link/install.sh | bash
cre version  # v1.0.11 확인
```

### 필요 도구

| 도구 | 버전 | 용도 |
|------|------|------|
| Node.js | v20+ | 런타임 |
| Bun | v1.3+ | CRE 프로젝트 빌드 |
| CRE CLI | v1.0.11 | 워크플로우 시뮬레이션/배포 |
| Foundry | 최신 | 스마트컨트랙트 배포 |
| Sepolia ETH | Faucet | 테스트넷 배포 |
| Gemini API Key | - | LLM 연동 (부트캠프 예제) |

### CRE 워크플로우란?

CRE(Chainlink Runtime Environment)는 오프체인 연산을 Chainlink 네트워크에서 검증 가능하게 실행하는 환경.

```
워크플로우 = 블록체인 + 외부 데이터/API + 로직
            → CRE가 오케스트레이션
            → 시뮬레이션 (cre simulate) 또는 라이브 배포
```

### 참고 자료

- CRE 부트캠프: https://smartcontractkit.github.io/cre-bootcamp-2026/
- CRE 부트캠프 레포: https://github.com/smartcontractkit/cre-bootcamp-2026
- CRE 템플릿: https://github.com/smartcontractkit/cre-templates/
- CRE CLI 설치: https://docs.chain.link/cre/getting-started/cli-installation
- 부트캠프 영상: https://www.youtube.com/playlist?list=PLVP9aGDn-X0S-JmwQKGTao6o_CMitvv2_

---

## E. 심사 기준

FAQ 원문: "Projects are evaluated based on:"

1. **Technical execution** — 코드 품질, 완성도
2. **Blockchain technology application** — 블록체인 활용 수준
3. **Effective use of CRE** — CRE 활용의 의미 있는 정도
4. **Originality (wow factor)** — 독창성

> 가중치는 미공개. 이전 Chainlink 해커톤 패턴으로 볼 때 대략 균등 배분 추정.

---

## F. IGR 타겟 트랙 및 적합성

### Primary: Prediction Markets ($16K)

공식 설명: "systems that enable automated, verifiable settlement of prediction markets based on events, outcomes, or data signals"

- IGR = AI-powered prediction market settlement engine ✅
- Event-driven market resolution using offchain data ✅
- 공식 예시 "AI-powered prediction market settlement"과 **정확히 일치**

### Secondary: CRE & AI ($17K)

공식 설명: "AI into Web3 workflows to assist with decision-making, automation, or execution"

- IGR = AI-in-the-loop (proposer/challenger) + CRE orchestration ✅

### Tertiary: Risk & Compliance ($16K)

공식 설명: "monitoring, safeguards, and automated controls"

- IGR = 정책 기반 안전장치, 8개 게이트 자동 감시 ✅

---

## G. IGR 현재 상태 vs 요구사항 갭 분석

| 요구사항 | 현재 상태 | 갭 | 우선순위 |
|----------|-----------|-----|----------|
| CRE Workflow | `creAdapter.js` (자체 sim) | **CRE CLI `cre simulate` 미실행** | 🔴 필수 |
| 블록체인 + 외부 API | Chainlink Feed + 3개 CEX/API | ✅ 충족 | - |
| CRE 시뮬레이션 증빙 | 없음 | **CRE CLI 실행 로그/캡처 필요** | 🔴 필수 |
| 3-5분 데모 영상 | 3:56 영상 있음 | CRE 시뮬레이션 장면 추가 필요 | 🟡 보강 |
| Public GitHub | 커밋 완료, push 대기 | push만 하면 됨 | 🟢 쉬움 |
| README Chainlink 링크 | 있음 | ✅ 충족 | - |
| 해커톤 기간 작업 | git 히스토리 2/24~ | ✅ 충족 | - |

### 핵심 TODO (마감까지 13일)

```
1. [필수] CRE CLI 설치 + CRE 워크플로우 구현
   - IGR 파이프라인을 CRE 워크플로우로 래핑
   - `cre simulate` 성공 로그 확보
   
2. [필수] GitHub push (레포 생성 대기 중)

3. [권장] 데모 영상 v3 — CRE 시뮬레이션 장면 포함

4. [권장] Sepolia 배포 — IgrRegistry.sol

5. [선택] arXiv 백서 업로드
```

---

## H. 참가 자격 / 법적

- 전 세계 참가 가능 (미국 제재국 제외)
- 참가비 무료
- 팀: 1~5명
- **IP: 팀이 전체 소유** (FAQ 명시)
- 수상 시 KYC 필요
- 행동강령 위반 시 퇴출 가능
- AI 사용: 허용 (Autonomous Agents 트랙 면책 조항에 명시)

---

## I. 제출 링크

- **제출 폼**: https://airtable.com/appgJctAaKPFkMKrW/pagPPG1kBRC0C54w6/form
- **등록**: https://chain.link/hackathon 상단 Register Now
- **Discord**: 해커톤 참가자 채널 (가입 필요)
- **DevRel 문의**: 공식 Developer Experts 연결 가능

---

## J. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-24 | 마감 Mar 1 → **Mar 8**로 연장 확인 |
| 2026-02-24 | Autonomous Agents 트랙 신규 추가 확인 ($5K, Moltbook 전용) |
| 2026-02-24 | CRE 요구사항 구체화: `cre simulate` 또는 라이브 배포 증빙 필수 |
| 2026-02-24 | CRE 부트캠프/템플릿/CLI 설치 가이드 링크 추가 |
| 2026-02-24 | 총 상금 $120K+ 확인 |
