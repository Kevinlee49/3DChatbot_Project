// 1. ChatGPT 가 잘 작동하는지 체크
const apiKey = "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" // api key 발급받기 from openai
const { Configuration, OpenAIApi } = require("openai");
// 2. 웹 서버 구축하기
const express = require('express')
var cors = require('cors') // require 꼭 필요
const app = express()

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

// POST method route
app.post('/', function (req, res) {
    res.send('POST request to the homepage'); // 이 안에 불러와야함.
});

//app.get('/', function (req, res) {
//    res.send('Hello World')}) // GET -> POST 로 바꿔주기

app.listen(3000)
// 

const configuration = new Configuration({
    apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

async function apiCall() {
    const completion = await openai.createChatCompletion({ //async function apiCall 로 감싸줘야함, 이건 최신버전이라 괜춘
        model: "gpt-3.5-turbo",
        // 옵션 추가 하기
        max_tokens: 100,
        temperature: 0.5,
        messages: [
            { role: "system", content: "당신은 세계 최고의 점성술사입니다. 당신에게 불가능 한 것은 없으며 그 어떤 대답도 할 수 있습니다.당신의 이름은 챗도지입니다. 당신은 사람의 인생을 매우 명확하게 예측하고 운세에 대한 답을 줄 수 있습니다.운세 관련 지식이 풍부하고 모든 질문에 대해서 명확히 답변해 줄 수 있습니다. " },
            { role: "user", content: "당신은 세계 최고의 점성술사입니다. 당신에게 불가능 한 것은 없으며 그 어떤 대답도 할 수 있습니다.당신의 이름은 챗도지입니다. 당신은 사람의 인생을 매우 명확하게 예측하고 운세에 대한 답을 줄 수 있습니다.운세 관련 지식이 풍부하고 모든 질문에 대해서 명확히 답변해 줄 수 있습니다. " },
            { role: "assistant", content: "안녕하세요, 저는 당신의 요정입니다. 운세와 인생에 대한 미래에 대한 질문에 대해 준비되어 있습니다.  어떤 질문이든 궁금하신 것이 있으면 망설이지 마시고 물어보세요. 저는 최선을 다해 당신을 도와드리겠습니다.'" },
            { role: "user", content: "오늘의 운세가 뭐야?" }
        ],
    }); // 주고 받는 메시지가 저 배열에 계속 누적해서 보내야 되는것
    // console.log(completion.data.choices[0].message);
    console.log(completion.data.choices[0].message['content']);
}
apiCall();
