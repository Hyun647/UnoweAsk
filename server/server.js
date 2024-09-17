const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const adminSockets = new Set(); // 관리자 페이지의 소켓 저장

io.on('connection', (socket) => {
    console.log(`클라이언트 ${socket.id}가 연결되었습니다.`);

    // 연결된 클라이언트의 유형에 따라 관리자와 공개 페이지를 구분합니다.
    socket.on('identify', (type) => {
        if (type === 'admin') {
            adminSockets.add(socket); // 관리자 페이지 소켓 저장
            console.log('관리자 페이지 소켓이 연결되었습니다.');
        } else if (type === 'client') {
            console.log('공개 페이지 소켓이 연결되었습니다.');
        }
    });

    socket.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'question') {
                console.log(`질문 수신: ${data.text}`);
                // 모든 관리자 페이지 클라이언트에게 질문을 전송합니다.
                adminSockets.forEach((adminSocket) => {
                    adminSocket.send(JSON.stringify({ type: 'question', text: data.text }));
                });
            } else if (data.type === 'answer') {
                console.log(`답변 수신: ${data.text}`);
                // 모든 공개 페이지 클라이언트에게 답변을 전송합니다.
                io.emit('message', JSON.stringify({ type: 'answer', text: data.text }));
            } else {
                console.log('받은 메시지: ', data);
            }
        } catch (error) {
            console.error('메시지 처리 중 오류 발생: ', error.message);
        }
    });

    socket.on('disconnect', () => {
        adminSockets.delete(socket); // 연결 종료 시 관리자 소켓에서 제거
        console.log(`클라이언트 ${socket.id}와의 연결이 종료되었습니다.`);
    });

    socket.on('error', (error) => {
        console.error('웹소켓 오류 발생: %s', error.message);
    });
});

const PORT = 4747;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 시작되었습니다.`);
});