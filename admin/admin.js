const adminWs = new WebSocket('ws://110.15.29.199:9727');

let selectedQuestionId = null;

adminWs.onopen = () => {
    console.log('관리자 웹소켓 서버와 연결되었습니다.');
    adminWs.send(JSON.stringify({ type: 'identify', message: 'admin' }));

    // 페이지 로드 시 기존 질문 가져오기
    fetchQuestions();
};

adminWs.onmessage = (event) => {
    try {
        const message = JSON.parse(event.data);
        const qaContainer = document.getElementById('qa-container');
        
        if (message.type === 'question') {
            const questionId = message.questionId; 
            qaContainer.innerHTML += `
                <div class="qa-item" id="question-${questionId}" onclick="selectQuestion(${questionId})">
                    <button class="delete-btn" onclick="deleteQuestion(event, ${questionId})">삭제</button>
                    <div class="question">
                        <strong>질문:</strong> ${message.message}
                    </div>
                    <div class="answer">
                        답변 대기중
                    </div>
                </div>`;
        } else if (message.type === 'answer') {
            const lastQaItem = qaContainer.querySelector(`#question-${message.questionId}`);
            if (lastQaItem) {
                lastQaItem.querySelector('.answer').innerHTML = `
                    <strong>답변:</strong> ${message.message}`;
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

adminWs.onclose = () => {
    console.log('관리자 웹소켓 서버와의 연결이 종료되었습니다.');
};

adminWs.onerror = (error) => {
    console.error('관리자 웹소켓 오류 발생: ', error);
};

function selectQuestion(questionId) {
    // 이전에 선택된 질문 박스에서 'selected' 클래스 제거
    const previouslySelected = document.querySelector('.qa-item.selected');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected');
    }

    // 현재 선택된 질문 박스에 'selected' 클래스 추가
    selectedQuestionId = questionId;
    const currentQuestion = document.getElementById(`question-${questionId}`);
    if (currentQuestion) {
        currentQuestion.classList.add('selected');
    }

    // 답변 섹션 표시
    document.getElementById('response-section').style.display = 'block';
}

function sendResponse() {
    const responseInput = document.getElementById('responseInput');
    const response = responseInput.value;
    if (adminWs.readyState === WebSocket.OPEN && response && selectedQuestionId !== null) {
        adminWs.send(JSON.stringify({ type: 'answer', message: response, questionId: selectedQuestionId }));
        console.log('관리자 페이지에서 서버로 답변을 보냈습니다: ', response);
        responseInput.value = '';
        document.getElementById('response-section').style.display = 'none';

        // 선택된 질문 박스에서 'selected' 클래스 제거
        const currentQuestion = document.getElementById(`question-${selectedQuestionId}`);
        if (currentQuestion) {
            currentQuestion.classList.remove('selected');
        }

        selectedQuestionId = null;
    } else {
        console.error('웹소켓이 열려있지 않거나 답변이 비어있거나 질문이 선택되지 않았습니다.');
    }
}

function deleteQuestion(event, questionId) {
    event.stopPropagation(); // 클릭 이벤트가 부모 요소로 전파되지 않도록 방지

    if (confirm('이 질문을 삭제하시겠습니까?')) {
        fetch(`http://110.15.29.199:9727/questions/${questionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('서버 오류: ' + response.status);
            }
            document.getElementById(`question-${questionId}`).remove();
            console.log('질문이 성공적으로 삭제되었습니다.');
        })
        .catch(error => console.error('질문 삭제 오류:', error));
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
                <div class="qa-item" id="question-${question.questionId}" onclick="selectQuestion(${question.questionId})">
                    <button class="delete-btn" onclick="deleteQuestion(event, ${question.questionId})">삭제</button>
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

function cancelResponse() {
    document.getElementById('responseInput').value = ''; // 답변 입력창 초기화
    document.getElementById('response-section').style.display = 'none'; // 답변 섹션 숨기기

    // 선택된 질문 박스에서 'selected' 클래스 제거
    const currentQuestion = document.getElementById(`question-${selectedQuestionId}`);
    if (currentQuestion) {
        currentQuestion.classList.remove('selected');
    }

    selectedQuestionId = null; // 선택된 질문 ID 초기화
}