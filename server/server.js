const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

wss.on('connection', (ws, req) => {
    // 클라이언트의 IP 주소를 얻고, IPv4 형식으로 변환
    let ip = req.connection.remoteAddress;
    
    // IP가 ':ffff:'로 시작하면 제거하고 IPv4 주소만 남김
    if (ip.startsWith('::ffff:')) {
        ip = ip.split('::ffff:')[1];
    }

    console.log(`클라이언트 ${ip}가 연결되었습니다.`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // identify 타입에 따른 접속 로그 출력
            if (data.type === 'identify') {
                console.log(`${data.message}이 접속하였습니다. IP: ${ip}`);
            } else {
                // 그 외 메시지 처리
                let logMessage = `받은 메시지: ${data.message} | type: ${data.type}, IP: ${ip}`;

                // questionId가 존재할 경우 로그에 추가
                if (data.questionId) {
                    logMessage += `, questionId: ${data.questionId}`;
                }

                console.log(logMessage);

                // 메시지 타입이 identify가 아닌 경우에만 모든 클라이언트에게 전송
                if (data.type !== 'identify') {
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            if (data.type === 'question' || data.type === 'answer') {
                                const messageToSend = {
                                    ...data,
                                    questionId: data.id || data.questionId
                                };
                                delete messageToSend.id;
                                client.send(JSON.stringify(messageToSend));
                            } else {
                                client.send(JSON.stringify(data));
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error(`메시지 처리 중 오류 발생: ${error.message} (IP: ${ip})`);
        }
    });

    ws.on('close', () => {
        console.log(`클라이언트 ${ip}와의 연결이 종료되었습니다.`);
    });

    ws.on('error', (error) => {
        console.error(`웹소켓 오류 발생: ${error.message} (IP: ${ip})`);
    });
});

const PORT = 4567;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 시작되었습니다.`);
});