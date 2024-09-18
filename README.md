# UnoweAsk

![UnoweAsk](https://github.com/Hyun647/hyun647.github.io/blob/master/images/UnoweAsk_img1.png?raw=true)

**UnoweAsk**는 실시간 질문과 답변을 제공하는 온라인 플랫폼입니다. 이 프로젝트는 Node.js와 WebSocket을 활용하여 클라이언트 간의 실시간 데이터 동기화를 구현하였으며, Docker를 사용하여 개발 및 배포 환경을 관리합니다.

---

## 🚀 시작하기

1. **저장소 클론하기**
   ```bash
   git clone https://github.com/hyun647/unoweask.git
   cd unoweask
   ```

2. **필요한 패키지 설치**
   ```bash
   npm install
   ```

3. **서버 실행하기**
   ```bash
   node server.js
   ```

   **이 프로젝트는 Docker에서 구동하길 권장합니다.**

---

## 🛠 기능

- **실시간 질문/답변 관리**: WebSocket을 이용하여 질문과 답변을 실시간으로 처리합니다.
- **질문 추가**: 클라이언트가 질문을 추가하고 관리자에게 전달합니다.
- **답변 추가**: 관리자가 질문에 답변을 추가합니다.
- **질문 삭제**: 관리자가 질문을 삭제할 수 있습니다.
- **질문 조회**: 클라이언트와 관리자는 모든 질문을 조회할 수 있습니다.

---

## 📦 기술 스택

- **Backend**: Node.js, Express, WebSocket, MySQL
- **Frontend**: HTML, CSS, JavaScript
- **데이터베이스**: MySQL

---

## 📝 파일 설명

- **admin/index.html**: 관리자 웹 인터페이스
- **admin/style.css**: 관리자 페이지 스타일 시트
- **admin/admin.js**: 관리자 웹소켓 처리 로직
- **client/index.html**: 클라이언트 웹 인터페이스
- **client/style.css**: 클라이언트 페이지 스타일 시트
- **client/client.js**: 클라이언트 웹소켓 처리 로직
- **server/server.js**: 서버 및 웹소켓 처리 로직

---

## 🛠 실행 방법

1. **서버 실행**

   서버를 시작하면 웹소켓 서버가 클라이언트와 관리자 모두의 연결을 기다립니다.

2. **클라이언트 페이지**

   클라이언트는 질문을 입력하고 전송하여 서버로 보낼 수 있습니다.

3. **관리자 페이지**

   관리자는 질문을 보고, 답변을 추가하거나 질문을 삭제할 수 있습니다.

---

## 📜 API 엔드포인트

- **GET /questions**: 모든 질문 조회
- **DELETE /questions/:id**: 특정 질문 삭제

---

## 📈 디버깅 및 오류 처리

- 서버 콘솔에 WebSocket 및 데이터베이스 관련 오류 로그가 출력됩니다.
- 클라이언트와 관리자 페이지에서 발생하는 오류는 브라우저 콘솔에서 확인할 수 있습니다.

---

## 화면 미리보기

### 질문과 답변 페이지

![질문과 답변 페이지](https://github.com/Hyun647/hyun647.github.io/blob/master/images/UnoweAsk_img1.png?raw=true)

질문 페이지와 답변 페이지를 동시에 띄운 모습입니다.

### 질문에 답변 작성 중

![답변 작성 중](https://github.com/Hyun647/hyun647.github.io/blob/master/images/UnoweAsk_img2.png?raw=true)

질문에 답변을 작성하는 장면입니다.

### 답변이 달린 후

![답변 달린 후](https://github.com/Hyun647/hyun647.github.io/blob/master/images/UnoweAsk_img3.png?raw=true)

답변이 달리고 난 후의 모습입니다.

### 질문 삭제 중

![질문 삭제 중](https://github.com/Hyun647/hyun647.github.io/blob/master/images/UnoweAsk_img4.png?raw=true)

질문을 삭제하는 장면입니다.

### 삭제한 질문이 사라진 후

![삭제한 질문 사라진 후](https://github.com/Hyun647/hyun647.github.io/blob/master/images/UnoweAsk_img5.png?raw=true)

삭제한 질문이 사라진 후의 모습입니다.

---
💡 **UnoweAsk**를 사용해 주셔서 감사합니다! 질문이나 피드백은 [이곳](https://github.com/hyun647/unoweask/issues)에서 남겨주세요.
