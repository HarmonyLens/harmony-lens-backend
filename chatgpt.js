const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const configuration = new Configuration({
  apiKey: process.env.CHATGPT_SECRET,
});

const openai = new OpenAIApi(configuration);

async function runCompletion(mood) {
  const GPT35TurboMessage = [
    {
      role: "system",
      content: `Create me a song in ${mood} theme. I want to see song notes in json format.There is sample json format at below\n
            {
                "song": "Sad Song",
                "key": "A minor",
                "tempo": 80,
                "sections": [
                {
                    "name": "Verse",
                    "notes": [
                    ["E4", "2"],
                    ["C4", "1"],
                    ]
                },
                ]
            }`,
    },
  ];
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: GPT35TurboMessage,
  });
  console.log(completion.data.choices[0].message.content);
}
runCompletion("happy");
