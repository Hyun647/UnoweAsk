const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql2');
const cors = require('cors');

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

function saveQuestion(message, questionId, ip, callback) {
    const query = 'INSERT INTO questions (message, questionId, ip_address) VALUES (?, ?, ?)';
    pool.query(query, [message, questionId, ip], (err, results) => {
        if (err) {
            console.error('질문 저장 오류:', err);
            return callback(err);
        }
        callback(null, results);
    });
}

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
                let logMessage = `받은 메시지: ${data.message} | type: ${data.type}, IP: ${ip}`;

                if (data.questionId) {
                    logMessage += `, questionId: ${data.questionId}`;
                }

                console.log(logMessage);

                if (data.type === 'question') {
                    saveQuestion(data.message, data.questionId, ip, (err, results) => {
                        if (err) return;
                        console.log('질문 저장 성공:', results);
                    });
                } else if (data.type === 'answer') {
                    saveAnswer(data.message, data.questionId, (err, results) => {
                        if (err) return;
                        console.log('답변 저장 성공:', results);
                    });
                } else if (data.type === 'deleteQuestion') {
                    deleteQuestion(data.questionId, (err, results) => {
                        if (err) return;
                        console.log('질문 삭제 성공:', results);
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