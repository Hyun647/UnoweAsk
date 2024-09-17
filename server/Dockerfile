# Node.js 최신 이미지 사용
FROM node:latest

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 패키지 파일을 컨테이너에 복사
COPY package*.json ./

# 패키지 설치
RUN npm install

# 애플리케이션 소스 코드를 컨테이너에 복사
COPY . .

# 애플리케이션 실행
CMD [ "node", "server.js" ]