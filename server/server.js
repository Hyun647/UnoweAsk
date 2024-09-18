const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql2');
const cors = require('cors');

// 현재 시간을 "YYYY-MM-DD HH:mm:ss" 형식으로 반환하는 함수
function getCurrentTime() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const pool = mysql.createPool({
    host: '110.15.29.199',
    port: 3347,
    user: 'root',
    password: '1590',
    database: 'qa_db'
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

pool.getConnection((err, connection) => {
    if (err) {
        console.error('데이터베이스 연결 오류:', err);
        return;
    }
    console.log('데이터베이스에 연결되었습니다.');
    connection.release();
});

// 질문 저장: 현재 서버 시간을 `question_time`으로 저장
function saveQuestion(message, questionId, ip, callback) {
    const questionTime = getCurrentTime(); // 서버의 현재 시간
    const query = 'INSERT INTO questions (message, questionId, ip_address, question_time) VALUES (?, ?, ?, ?)';
    pool.query(query, [message, questionId, ip, questionTime], (err, results) => {
        if (err) {
            console.error('질문 저장 오류:', err);
            return callback(err);
        }
        callback(null, results);
    });
}

// 답변 저장: 현재 서버 시간을 `answer_time`으로 저장
function saveAnswer(message, questionId, callback) {
    const answerTime = getCurrentTime(); // 서버의 현재 시간
    const query = 'UPDATE questions SET answer = ?, answer_time = ? WHERE questionId = ?';
    pool.query(query, [message, answerTime, questionId], (err, results) => {
        if (err) {
            console.error('답변 저장 오류:', err);
            return callback(err);
        }
        callback(null, results);
    });
}

function deleteQuestion(questionId, callback) {
    const query = 'DELETE FROM questions WHERE questionId = ?';
    pool.query(query, [questionId], (err, results) => {
        if (err) {
            console.error('질문 삭제 오류:', err);
            return callback(err);
        }
        console.log(`질문이 삭제되었습니다: ${questionId}`);
        callback(null, results);
    });
}

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
    let ip = req.connection.remoteAddress;

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
                let logMessage = `[${getCurrentTime()}] 받은 메시지: ${data.message} | type: ${data.type}, IP: ${ip}`;

                if (data.questionId) {
                    logMessage += `, questionId: ${data.questionId}`;
                }

                console.log(logMessage);

                if (data.type === 'question') {
                    saveQuestion(data.message, data.questionId, ip, (err, results) => {
                        if (err) return;
                        console.log(`[${getCurrentTime()}] 질문 저장 성공: message=${data.message} | questionId=${data.questionId} | ip_address=${ip} | question_time=${getCurrentTime()}`);
                    });
                } else if (data.type === 'answer') {
                    saveAnswer(data.message, data.questionId, (err, results) => {
                        if (err) return;
                        console.log(`[${getCurrentTime()}] 답변 저장 성공: message=${data.message} | questionId=${data.questionId} | answer_time=${getCurrentTime()}`);
                    });
                } else if (data.type === 'deleteQuestion') {
                    deleteQuestion(data.questionId, (err, results) => {
                        if (err) return;
                        console.log(`[${getCurrentTime()}] 질문 삭제 성공: questionId=${data.questionId}`);
                        wss.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({ type: 'questionDeleted', questionId: data.questionId }));
                            }
                        });
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
            console.error(`[${getCurrentTime()}] 메시지 처리 중 오류 발생: ${error.message} (IP: ${ip})`);
        }
    });

    ws.on('close', () => {
        console.log(`[${getCurrentTime()}] 클라이언트 ${ip}와의 연결이 종료되었습니다.`);
    });

    ws.on('error', (error) => {
        console.error(`[${getCurrentTime()}] 웹소켓 오류 발생: ${error.message} (IP: ${ip})`);
    });
});

getQuestions((err, results) => {
    if (err) return;
    console.log(`[${getCurrentTime()}] 초기 질문 로딩:`, results);
});

app.get('/questions', (req, res) => {
    getQuestions((err, results) => {
        if (err) {
            return res.status(500).json({ error: '질문 불러오기 오류' });
        }
        res.json(results);
    });
});

app.delete('/questions/:id', (req, res) => {
    const questionId = req.params.id;
    deleteQuestion(questionId, (err, result) => {
        if (err) {
            res.status(500).json({ error: '질문 삭제 오류' });
        } else {
            res.json({ message: '질문이 삭제되었습니다.' });
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'questionDeleted', questionId }));
                }
            });
        }
    });
});

const PORT = 3347;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 시작되었습니다.`);
});