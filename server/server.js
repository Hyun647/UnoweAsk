const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql2');
const cors = require('cors'); // 추가

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// MySQL 데이터베이스 연결 설정
const pool = mysql.createPool({
    host: '110.15.29.199',
    port: 3347,
    user: 'root',
    password: '1590',
    database: 'qa_db'
});

// CORS 설정
app.use(cors({
    origin: 'http://110.15.29.199:5500', // 허용할 출처
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// 연결 테스트
pool.getConnection((err, connection) => {
    if (err) {
        console.error('데이터베이스 연결 오류:', err);
        return;
    }
    console.log('데이터베이스에 연결되었습니다.');
    connection.release();
});

// 질문 저장 함수
function saveQuestion(message, questionId, callback) {
    const query = 'INSERT INTO questions (message, questionId) VALUES (?, ?)';
    pool.query(query, [message, questionId], (err, results) => {
        if (err) {
            console.error('질문 저장 오류:', err);
            return callback(err);
        }
        callback(null, results);
    });
}

// 답변 저장 함수
function saveAnswer(message, questionId, callback) {
    const query = 'UPDATE questions SET answer = ? WHERE questionId = ?';
    pool.query(query, [message, questionId], (err, results) => {
        if (err) {
            console.error('답변 저장 오류:', err);
            return callback(err);
        }
        callback(null, results);
    });
}

// 데이터베이스에서 질문 불러오기
function getQuestions(callback) {
    const query = 'SELECT * FROM questions';
    pool.query(query, (err, results) => {
        if (err) {
            console.error('질문 불러오기 오류:', err);
            return callback(err);
        }
        callback(null, results);
    });
}

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

            if (data.type === 'identify') {
                console.log(`${data.message}이 접속하였습니다. IP: ${ip}`);
            } else {
                let logMessage = `받은 메시지: ${data.message} | type: ${data.type}, IP: ${ip}`;

                if (data.questionId) {
                    logMessage += `, questionId: ${data.questionId}`;
                }

                console.log(logMessage);

                if (data.type === 'question') {
                    saveQuestion(data.message, data.questionId, (err, results) => {
                        if (err) return;
                        console.log('질문 저장 성공:', results);
                    });
                } else if (data.type === 'answer') {
                    saveAnswer(data.message, data.questionId, (err, results) => {
                        if (err) return;
                        console.log('답변 저장 성공:', results);
                    });
                }

                if (data.type !== 'identify') {
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            const messageToSend = {
                                ...data,
                                questionId: data.id || data.questionId
                            };
                            delete messageToSend.id;
                            client.send(JSON.stringify(messageToSend));
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

// 초기 질문 로딩
getQuestions((err, results) => {
    if (err) return;
    console.log('초기 질문 로딩:', results);
});

app.get('/questions', (req, res) => {
    getQuestions((err, results) => {
        if (err) {
            return res.status(500).json({ error: '질문 불러오기 오류' });
        }
        res.json(results);
    });
});

const PORT = 4567;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 시작되었습니다.`);
});