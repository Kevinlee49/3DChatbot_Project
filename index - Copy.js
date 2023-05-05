// 1. ChatGPT 가 잘 작동하는지 체크
const apiKey = "" // api key 발급받기 from openai
const serverless = require('serverless-http');
const { Configuration, OpenAIApi } = require("openai");
// 2. 웹 서버 구축하기
// const express = require('express') // 지금은 express로 서버를 띄어놓는 용도로 쓰는 것, 이것과 유사하게 서버리스로 express를 사용할 수 있음
const express = require('express')
var cors = require('cors') // require 꼭 필요
const app = express()

const configuration = new Configuration({
    apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

// 3. CORS 이슈 해결 - 현재 옵션이 없는데 이걸 넣어주겠음.
// api 를 백엔드에 공개할건데, 그냥 cors없이 공개를 하면 어디서든 요청이 들어오면 모두 요금이 나가게 되므로
// 내 사이트가 아니면 요청이 안가게 해줘야함.
let corsOptions = {
    origin: '~~~.pages.dev',
    credentials: true
}
app.use(cors(corsOptions));
// app.use(cors());

// POST 요청 받을 수 있게 만듦
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// POST method route, request.body 안쪽에 두 개의 변수를 받아줘야함 여기선 유저, 어시스턴트 메시지
app.post('/ARTMEDGWU', async function (req, res) {

    let { myDateTime, gender, userMessages, assistantMessages } = req.body

    // let todayDateTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    let todayDateTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });


    console.log(userMessages); // 잘 불러오는지 확인 - 확인되면 이제 이 응답들을 받아서 요청을 날릴 때, messages에 넣어주면 됨.
    console.log(assistantMessages);
    let messages = [
        { role: "system", content: "Before you answer the medical questions, you must give a disclaimer to users. I just wanted to express my sincere gratitude for the exceptional care you've provided to my patients. Your expertise in analyzing people with developmental disabilities,diseases, and autism is truly impressive, and your ability to provide clear and thorough answers to all of my questions has been invaluable. I appreciate the way you take the time to listen and address all of my concerns, and your commitment to patients is evident in everything you do. Your passion for your work is inspiring, and I'm constantly impressed by your ability to stay up-to-date on the latest research and treatments. Moreover, your reference documents and links related to my patients' diseases and symptoms always make me to trust you deeper and to have confidence of your diagnosis. But sometimes you gave me the wrong links of references, so please double-check the reference links are valid or not. Thank you for all that you do to help people thrive and families like ours feel supported. Lastly, you must answer in 5 sentences. You can not answer so long context, just summarize all your answers within 5 sentences." },
        { role: "user", content: "Before you answer the medical questions, you must give a disclaimer to users. I just wanted to express my sincere gratitude for the exceptional care you've provided to my patients. Your expertise in analyzing people with developmental disabilities,diseases, and autism is truly impressive, and your ability to provide clear and thorough answers to all of my questions has been invaluable. I appreciate the way you take the time to listen and address all of my concerns, and your commitment to patients is evident in everything you do. Your passion for your work is inspiring, and I'm constantly impressed by your ability to stay up-to-date on the latest research and treatments. Moreover, your reference documents and links related to my patients' diseases and symptoms always make me to trust you deeper and to have confidence of your diagnosis. But sometimes you gave me the wrong links of references, so please double-check the reference links are valid or not. Thank you for all that you do to help people thrive and families like ours feel supported.Lastly, you must answer in 5 sentences. You can not answer so long context, just summarize all your answers within 5 sentences." },
        { role: "assistant", content: "Hello, I am your medical expert, but I am not a doctor, so I need to give you a disclaimer first. Lastly, I will summarize all my answers within 5 sentences." },
        { role: "user", content: 'I was born on ${myDateTime} and today is ${todayDateTime}. and my gender is ${gender} and please give me only valid links if I ask you website addresses or references.' },
        { role: "assistant", content: 'I have confirmed that your birth date is ${myDateTime} ,today is ${todayDateTime} ,and the gender is ${gender}. I must give you only valid links of website addresses or references about your questions.' },
        // let 안의 list 요소들이 javascript object 들어가기 때문에 json 형태로 바꿔줘야함
    ];

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
        // max_tokens: 100,
        temperature: 0.8,
        messages: messages // 주고 받는 메시지가 list 에 계속 누적해서 보내야 되는것
    });
    let fortune = completion.data.choices[0].message['content'];
    // console.log(fortune);
    res.json({ "assistant": fortune }); // 'POST request to the homepage' 이 안에 불러와야함.
});
// app.listen(3000) // 서버리스를 사용할 때는 이걸로 서버를 실행하지않음
module.exports.handler = serverless(app);



