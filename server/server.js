const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

wss.on('connection', (ws, req) => {
    // 클라이언트의 IP 주소를 로그로 출력합니다.
    const ip = req.connection.remoteAddress;
    console.log(`클라이언트 ${ip}가 연결되었습니다.`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'admin') {
                console.log(`어드민 페이지에서 메시지 수신: ${data.message}`);
            } else if (data.type === 'client') {
                console.log(`공개 페이지에서 메시지 수신: ${data.message}`);
            } else {
                console.log('받은 메시지: ', data);
            }
            
            // 받은 메시지를 모든 클라이언트에게 전송합니다.
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } catch (error) {
            console.error('메시지 처리 중 오류 발생: ', error.message);
        }
    });

    ws.on('close', () => {
        console.log(`클라이언트 ${ip}와의 연결이 종료되었습니다.`);
    });

    ws.on('error', (error) => {
        console.error('웹소켓 오류 발생: %s', error.message);
    });
});

const PORT = 4567;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 시작되었습니다.`);
});