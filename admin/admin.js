const adminWs = new WebSocket('ws://110.15.29.199:4567');

let selectedQuestionId = null;

adminWs.onopen = () => {
    console.log('관리자 웹소켓 서버와 연결되었습니다.');
    adminWs.send(JSON.stringify({ type: 'identify', message: 'admin' }));
};

adminWs.onmessage = (event) => {
    try {
        const message = JSON.parse(event.data);
        console.log('관리자 페이지에서 받은 메시지: ', message);
        const qaContainer = document.getElementById('qa-container');
        
        if (message.type === 'client-message') {
            const questionId = Date.now(); // 고유한 ID 생성 (예: 현재 시간)
            qaContainer.innerHTML += `
                <div class="qa-item" id="question-${questionId}" onclick="selectQuestion(${questionId})">
                    <div class="question">
                        <strong>질문:</strong> ${message.message}
                    </div>
                </div>`;
        } else if (message.type === 'admin-message') {
            const lastQaItem = qaContainer.querySelector(`#question-${message.questionId}`);
            if (lastQaItem) {
                lastQaItem.innerHTML += `
                    <div class="answer">
                        <strong>답변:</strong> ${message.message}
                    </div>`;
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
    selectedQuestionId = questionId;
    document.getElementById('response-section').style.display = 'block';
}

function sendResponse() {
    const responseInput = document.getElementById('responseInput');
    const response = responseInput.value;
    if (adminWs.readyState === WebSocket.OPEN && response && selectedQuestionId !== null) {
        adminWs.send(JSON.stringify({ type: 'admin-message', message: response, questionId: selectedQuestionId }));
        console.log('관리자 페이지에서 서버로 답변을 보냈습니다: ', response);
        responseInput.value = '';
        document.getElementById('response-section').style.display = 'none';
        selectedQuestionId = null;
    } else {
        console.error('웹소켓이 열려있지 않거나 답변이 비어있거나 질문이 선택되지 않았습니다.');
    }
}