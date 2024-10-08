let clientWs;
let reconnectInterval;

const clientWsConnect = () => {
    clientWs = new WebSocket('ws://110.15.29.199:9727');

    clientWs.onopen = () => {
        console.log('클라이언트 웹소켓 서버와 연결되었습니다.');
        clientWs.send(JSON.stringify({ type: 'identify', message: 'client' }));

        // 페이지 로드 시 기존 질문 가져오기
        fetchQuestions();

        // 재연결 성공 시 다시 연결 시도 중지
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };

    clientWs.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            const qaContainer = document.getElementById('qa-container');
            
            if (message.type === 'question') {
                const questionId = message.questionId; // 고유한 ID 생성
                qaContainer.innerHTML += `
                    <div class="qa-item" id="question-${questionId}">
                        <div class="question">
                            <strong>질문:</strong> ${message.message}
                        </div>
                        <div class="answer">
                            답변 대기중
                        </div>
                    </div>`;
            } else if (message.type === 'answer') {
                const qaItems = qaContainer.getElementsByClassName('qa-item');
                for (let i = 0; i < qaItems.length; i++) {
                    const item = qaItems[i];
                    if (item.id === `question-${message.questionId}`) {
                        const answerDiv = item.querySelector('.answer');
                        if (answerDiv) {
                            answerDiv.innerHTML = `<strong>답변:</strong> ${message.message}`;
                        }
                        break;
                    }
                }
            } else if (message.type === 'questionDeleted') {
                const questionId = message.questionId;
                const questionElement = document.getElementById(`question-${questionId}`);
                if (questionElement) {
                    questionElement.remove();
                }
            }
        } catch (error) {
            console.error('메시지 파싱 오류: ', error.message);
        }
    };

    clientWs.onclose = () => {
        console.log('클라이언트 웹소켓 서버와의 연결이 종료되었습니다.');
        attemptReconnect(); // 연결이 끊기면 재연결 시도
    };

    clientWs.onerror = (error) => {
        console.error('클라이언트 웹소켓 오류 발생: ', error);
    };
};

const attemptReconnect = () => {
    if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
            console.log('서버 재연결 시도 중...');
            clientWsConnect();
        }, 3000); // 3초마다 재연결 시도
    }
};

function sendQuestion() {
    const questionInput = document.getElementById('questionInput');
    const question = questionInput.value;
    if (clientWs.readyState === WebSocket.OPEN && question) {
        const questionId = Date.now(); // 질문 ID 생성
        clientWs.send(JSON.stringify({ type: 'question', message: question, questionId: questionId }));
        console.log('클라이언트 페이지에서 서버로 질문을 보냈습니다: ', question);
        questionInput.value = '';
    } else {
        console.error('웹소켓이 열려있지 않거나 질문이 비어있습니다.');
    }
}

// 질문 데이터 불러오기
function fetchQuestions() {
    fetch('http://110.15.29.199:9727/questions', { 
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('서버 오류: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        const qaContainer = document.getElementById('qa-container');
        data.forEach(question => {
            qaContainer.innerHTML += `
                <div class="qa-item" id="question-${question.questionId}">
                    <div class="question">
                        <strong>질문:</strong> ${question.message}
                    </div>
                    <div class="answer">
                        ${question.answer ? `<strong>답변:</strong> ${question.answer}` : '답변 대기중'}
                    </div>
                </div>`;
        });
    })
    .catch(error => console.error('질문 불러오기 오류:', error));
}

// 페이지 로드 시 웹소켓 연결 시도
clientWsConnect();