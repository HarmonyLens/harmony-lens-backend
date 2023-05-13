const { Configuration, OpenAIApi } = require("openai");
const MidiWriter = require("midi-writer-js");
const dotenv = require("dotenv");
dotenv.config();

function text2Emotion(text, mock = true) {
  console.log("text2Emotion");
  if (mock) {
    return new Promise((resolve, reject) => {
      return resolve({
        DocSentimentPolarity: "+",
        DocSentimentResultString: "positive",
        DocSentimentValue: 0.6196587352953113,
        Magnitude: 0.7428467549936436,
        Status: 200,
      });
    });
  } else {
    const fetch = require("node-fetch");

    const url = "http://api.text2data.com/v3/analyze";
    const payload = {
      DocumentText: text,
      IsTwitterContent: "false",
      PrivateKey: process.env.TEXT2DATA_APIKEY,
      Secret: process.env.TEXT2DATA_SECRET,
      RequestIdentifier: "", // optional, used for reporting context
    };

    return fetch(url, {
      method: "POST",
      body: new URLSearchParams(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.Status === 1) {
          return {
            DocSentimentPolarity: data.DocSentimentPolarity,
            DocSentimentResultString: data.DocSentimentResultString,
            DocSentimentValue: data.DocSentimentValue,
            Magnitude: data.Magnitude,
            Status: 200,
          };
        } else {
          return { Error: data.ErrorMessage, Status: 400 };
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

async function mood2Notes(mood) {
  console.log("Creating notes via ChatGPT");
  const configuration = new Configuration({
    apiKey: process.env.CHATGPT_SECRET,
  });

  const openai = new OpenAIApi(configuration);

  const GPT35TurboMessage = [
    {
      role: "system",
      content: `Create me a song in ${mood} theme. I want to see song notes in json format.There is sample json format at below. Answer only with json.\n
                    {
                        "song": "${mood} Song",
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
  const res = completion.data.choices[0].message.content;
  const json = JSON.parse(res);
  console.log("Notes created via ChatGPT");
  return json;
}

function data2Midi(noteData) {
  console.log("Creating MIDI file");
  // Create a new MIDI track
  const track = new MidiWriter.Track();

  // Set the tempo (optional)
  const tempo = noteData.tempo || 120;

  // Iterate over each section in the song
  for (const section of noteData.sections) {
    // Iterate over each note in the section
    for (const note of section.notes) {
      const [pitch, duration] = note;
      track.addEvent(
        new MidiWriter.NoteEvent({ pitch: pitch, duration: duration })
      );
    }
  }

  // Create a new MIDI file
  const write = new MidiWriter.Writer([track]);
  // Convert the MIDI data to bytes
  const data = write.buildFile();
  const byteArray = new Uint8Array(data);
  //   fs.writeFileSync("./audio.mid", Buffer.from(byteArray));
  console.log("MIDI file created");
  return Buffer.from(byteArray);
}

async function postsByHandle(handle) {
  console.log("Fetching posts from TheGraph");
  const query = `{
        posts(
            first: 5
            where: { and: [{profileId_: {handle: "${handle}"}}, {contentURI_contains: "arweave"}] }
        ) {
            id
            pubId
            profileId {
            id
            handle
            }
            contentURI
            timestamp
        }
        }`;
  const url = "https://api.thegraph.com/subgraphs/name/anudit/lens-protocol";
  return await fetch(url, {
    method: "POST",
    body: JSON.stringify({ query }),
  })
    .then((response) => response.json())
    .then(async (data) => {
      const posts = data.data.posts;

      const texts = await Promise.all(
        posts.map(async (post) => {
          try {
            const response = await fetch(post.contentURI);
            const data = await response.json();
            return data.content;
          } catch (e) {
            console.log(e);
          }
        })
      );

      const combined = texts.join(" ");
      console.log("Posts fetched from TheGraph");
      return combined;
    });
}

module.exports = { text2Emotion, mood2Notes, data2Midi, postsByHandle };
