![Status](https://img.shields.io/badge/status-in--development-orange)
# 🟢 MongoLive - JSON & EJSON Explorer
> *Miller Column 기반 뷰어 & 인라인 에디터 — 일반 JSON은 언제든 탐색하고, MongoDB/Firebase에서 쓰는 EJSON(ObjectId, DBRef, Date, Decimal128, Long)은 모든 기능을 그대로 열어둔다*
---
> ## https://jsb0315.github.io/Json-explorer/
> ![video-1](gif-1.gif)

### 💡기능
- Miller Column 드릴다운 — JSON/EJSON key-value 구조를 컬럼 단위로 파고들며 탐색
- ObjectId/DBRef 등 EJSON 타입 자동 판별 + 참조 필드 추적, 클릭 한번으로 연결 문서 점프 (PK 중복 시 후보 선택 모달)
- 일반 JSON도 컬렉션별 PK/FK 직접 선언으로 참조 등록 <br>
- 인라인 에디터 — Date/Decimal128/Long 같은 EJSON 타입도 그대로 수정, Undo 지원
- 컬럼별 검색 + 정렬 툴바 (DB/컬렉션/문서/필드 전부)
- DB·컬렉션 복제/이름변경/삭제, JSON 파일 드래그앤드롭 import
- breadcrumb 경로 네비게이션 + 탐색 컬럼 개수(2~) 조절
- 대용량 문서는 애니메이션 비활성화로 끊김 없이 처리
- ⚠️localstorage 사용이라 최대 약 5MB 사용가능

### 💡하고싶은거:
- MongoDB 실시간 대시보드 https://github.com/jsb0315/Mongolive_legacy 프론트부터 리뉴얼 <br>
- REF: [MongoDB Compass](https://www.mongodb.com/ko-kr/products/tools/compass), [Google Firestore 패널 뷰](https://firebase.google.com/docs/firestore/using-console?hl=ko)
</aside>

- 실제 API 연동 전 프론트엔드 - 백엔드 공유 타입 기반으로 더미 JSON 데이터 관리 Mock API 구성 <br>
- UI/UX 및 상태 관리를 선제적으로 유닛 테스트

### **💡환경**

- **AI**
    - **구글 제미나이 3.1 Pro Extended (아끼면서)**
    - **Copilot Pro - GPT-5.2-Codex**
    - **Claude Code pro(260616 못참고지름)**
- **개발**
    - **React 18, Vite**
    - **TypeScript**
    - **TailwindCSS, Lucide-react, Motion**
<br>

<br>

> **MongoDB Live Dashboard**

> ![1년전 프로토타입](image-1.png)
> 1년전 프로토타입

> ![FireStore 패널 뷰](image-2.png)
> FireStore 패널 뷰

<br>
<br>

> ![alt text](image.png)
> 프로토타입 2