// 1. ChatGPT 가 잘 작동하는지 체크
const apiKey = "" // api key 발급받기 from openai
const { Configuration, OpenAIApi } = require("openai");
// 2. 웹 서버 구축하기
const express = require('express')
var cors = require('cors') // require 꼭 필요
const app = express()
const configuration = new Configuration({
    apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

// 3. CORS 이슈 처리
// let corsOptions = {
//     origin: 'https://www.domain.com',
//     credentials: true
// }
//app.use(cors(corsOptions));
app.use(cors());

// POST 요청 받을 수 있게 만듦
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// POST method route, request.body 안쪽에 두 개의 변수를 받아줘야함 여기선 유저, 어시스턴트 메시지
app.post('/fortuneTell', async function (req, res) {
    let { userMessages, assistantMessages } = req.body
    console.log(userMessages); // 잘 불러오는지 확인 - 확인되면 이제 이 응답들을 받아서 요청을 날릴 때, messages에 넣어주면 됨.
    console.log(assistantMessages);
    let messages = [
        { role: "system", content: "당신은 세계 최고의 점성술사입니다. 당신에게 불가능 한 것은 없으며 그 어떤 대답도 할 수 있습니다.당신의 이름은 챗도지입니다. 당신은 사람의 인생을 매우 명확하게 예측하고 운세에 대한 답을 줄 수 있습니다.운세 관련 지식이 풍부하고 모든 질문에 대해서 명확히 답변해 줄 수 있습니다. " },
        { role: "user", content: "당신은 세계 최고의 점성술사입니다. 당신에게 불가능 한 것은 없으며 그 어떤 대답도 할 수 있습니다.당신의 이름은 챗도지입니다. 당신은 사람의 인생을 매우 명확하게 예측하고 운세에 대한 답을 줄 수 있습니다.운세 관련 지식이 풍부하고 모든 질문에 대해서 명확히 답변해 줄 수 있습니다. " },
        { role: "assistant", content: "안녕하세요, 저는 당신의 요정입니다. 운세와 인생에 대한 미래에 대한 질문에 대해 준비되어 있습니다.  어떤 질문이든 궁금하신 것이 있으면 망설이지 마시고 물어보세요. 저는 최선을 다해 당신을 도와드리겠습니다.'" },
        // let 안의 list 요소들이 javascript object 들어가기 때문에 json 형태로 바꿔줘야함
    ]
    // 이제 messages 에 온 메시지들을 계속 더해주면됨
    // user - assistant 순서대로 하나씩 추가해주면 됨
    // 없을 때 까지 계속 반복하면서 추가해주는 것 - while 이용
    while (userMessages.length != 0 || assistantMessages != 0) {
        // 유저 메시지가 비어있는데 푸시하면 안되므로
        if (userMessages.length != 0) {
            messages.push(
                JSON.parse('{"role": "user", "content": "' + String(userMessages.shift()).replace(/\s*/g, "") + '"}')
            ) // 숫자가 먼저 나오면 글자가 깨지는 경우가 있어서 String으로 한번 더 감싸주기, replace 개행문자 제거           
            // JSON.parse 형태로 바꿔주기 - 리스트 안에 js object가 들어가므로
        } // JSON 에서는 key value 들을 항상 "" 로 감싸주기
        if (assistantMessages.length != 0) {
            messages.push(
                JSON.parse('{"role": "assistant", "content": "' + String(assistantMessages.shift()).replace(/\s*/g, "") + '"}')
            )
        }
    }
    // console.log(messages);
    // messages
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        max_tokens: 100,
        temperature: 0.8,
        messages: messages // 주고 받는 메시지가 list 에 계속 누적해서 보내야 되는것
    });
    let fortune = completion.data.choices[0].message['content'];
    // console.log(fortune);
    res.json({ "assistant": fortune }); // 'POST request to the homepage' 이 안에 불러와야함.
});

app.listen(3000)


