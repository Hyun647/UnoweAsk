const clientWs = new WebSocket('ws://110.15.29.199:4567');

clientWs.onopen = () => {
    console.log('클라이언트 웹소켓 서버와 연결되었습니다.');
    clientWs.send(JSON.stringify({ type: 'identify', message: 'client' }));
};

clientWs.onmessage = (event) => {
    try {
        const message = JSON.parse(event.data);
        console.log('클라이언트 페이지에서 받은 메시지: ', message);
        const qaContainer = document.getElementById('qa-container');
        
        if (message.type === 'client-message') {
            qaContainer.innerHTML += `
                <div class="qa-item">
                    <div class="question">
                        <strong>질문:</strong> ${message.message}
                    </div>
                </div>`;
        } else if (message.type === 'admin-message') {
            const lastQaItem = qaContainer.querySelector('.qa-item:last-child');
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

clientWs.onclose = () => {
    console.log('클라이언트 웹소켓 서버와의 연결이 종료되었습니다.');
};

clientWs.onerror = (error) => {
    console.error('클라이언트 웹소켓 오류 발생: ', error);
};

function sendQuestion() {
    const questionInput = document.getElementById('questionInput');
    const question = questionInput.value;
    if (clientWs.readyState === WebSocket.OPEN && question) {
        clientWs.send(JSON.stringify({ type: 'client-message', message: question }));
        console.log('클라이언트 페이지에서 서버로 질문을 보냈습니다: ', question);
        questionInput.value = '';
    } else {
        console.error('웹소켓이 열려있지 않거나 질문이 비어있습니다.');
    }
}