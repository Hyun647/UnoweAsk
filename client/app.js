// 웹소켓 서버에 연결합니다.
const ws = new WebSocket('ws://110.15.29.199:4747');

// 웹소켓 연결이 열릴 때
ws.onopen = () => {
    console.log('클라이언트 웹소켓 서버와 연결되었습니다.');
    ws.send(JSON.stringify({ type: 'identify', message: 'client' }));
};

// 웹소켓 서버로부터 메시지를 받을 때
ws.onmessage = (event) => {
    try {
        const message = JSON.parse(event.data);
        console.log('클라이언트 페이지에서 받은 메시지: ', message);
        const messagesDiv = document.getElementById('messages');
        if (message.type === 'question') {
            messagesDiv.innerHTML += `<div><strong>질문:</strong> ${message.text}</div>`;
        } else if (message.type === 'answer') {
            messagesDiv.innerHTML += `<div><strong>답변:</strong> ${message.text}</div>`;
        }
    } catch (error) {
        console.error('메시지 파싱 오류: ', error.message);
    }
};

// 웹소켓 연결이 닫힐 때
ws.onclose = () => {
    console.log('클라이언트 웹소켓 서버와의 연결이 종료되었습니다.');
};

// 웹소켓에서 오류가 발생할 때
ws.onerror = (error) => {
    console.error('클라이언트 웹소켓 오류 발생: ', error);
};

// 클라이언트 페이지에서 질문을 전송하는 함수
function sendQuestion() {
    const questionInput = document.getElementById('questionInput');
    const question = questionInput.value;
    if (ws.readyState === WebSocket.OPEN && question) {
        ws.send(JSON.stringify({ type: 'question', text: question }));
        console.log('클라이언트 페이지에서 서버로 질문을 보냈습니다: ', question);
        questionInput.value = '';
    } else {
        console.error('웹소켓이 열려있지 않거나 질문이 비어있습니다.');
    }
}