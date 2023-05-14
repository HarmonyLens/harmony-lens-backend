const { Configuration, OpenAIApi } = require("openai");
const MidiWriter = require("midi-writer-js");
const dotenv = require("dotenv");
const { Web3Storage } = require("web3.storage");
const { File } = require("@web-std/file");
dotenv.config();

function text2Emotion(text, mock = true) {
  console.log("text2Emotion");
  if (mock) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        return resolve({
          DocSentimentPolarity: "+",
          DocSentimentResultString: "positive",
          DocSentimentValue: 0.6196587352953113,
          Magnitude: 0.7428467549936436,
          Status: 200,
        });
      }, 1000);
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

async function mood2Notes(mood, mock = true) {
  console.log("Creating notes via ChatGPT");
  if (mock) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        return resolve({
          song: "The Joyful Melody",
          key: "C major",
          tempo: 120,
          sections: [
            {
              name: "Verse 1",
              notes: [
                ["C4", "1"],
                ["C4", "1"],
                ["G4", "1"],
                ["G4", "1"],
                ["A4", "1"],
                ["A4", "1"],
                ["G4", "2"],
              ],
            },
            {
              name: "Chorus",
              notes: [
                ["G4", "2"],
                ["F4", "2"],
                ["E4", "4"],
                ["C4", "2"],
                ["D4", "2"],
                ["E4", "4"],
              ],
            },
            {
              name: "Verse 2",
              notes: [
                ["C4", "1"],
                ["C4", "1"],
                ["G4", "1"],
                ["G4", "1"],
                ["A4", "1"],
                ["A4", "1"],
                ["G4", "2"],
              ],
            },
            {
              name: "Chorus",
              notes: [
                ["G4", "2"],
                ["F4", "2"],
                ["E4", "4"],
                ["C4", "2"],
                ["D4", "2"],
                ["E4", "4"],
              ],
            },
            {
              name: "Bridge",
              notes: [
                ["F4", "2"],
                ["G4", "2"],
                ["A4", "4"],
                ["F4", "2"],
                ["G4", "2"],
                ["E4", "4"],
              ],
            },
            {
              name: "Chorus",
              notes: [
                ["G4", "2"],
                ["F4", "2"],
                ["E4", "4"],
                ["C4", "2"],
                ["D4", "2"],
                ["E4", "4"],
              ],
            },
            {
              name: "Outro",
              notes: [
                ["C4", "4"],
                ["G4", "4"],
                ["C4", "4"],
                ["G4", "4"],
                ["C4", "4"],
                ["G4", "4"],
                ["C4", "4"],
              ],
            },
          ],
        });
      }, 1000);
    });
  }

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

const uploadMidiFileToInfura = async (data) => {
  console.log("Uploading MIDI file to Infura");
  const blob = new Blob([data], { type: "application/json" });
  const metadata = {
    name: "audio.mid",
    description: "MIDI file generated from AI",
    image:
      "https://upload.wikimedia.org/wikipedia/en/b/b5/ImagineDragonsEvolve.jpg",
  };
  const files = [
    new File([blob], "audio.mid"),
    new File([JSON.stringify(metadata)], "metadata.json"),
  ];
  const client = new Web3Storage({ token: process.env.FILECOIN_API_KEY });
  const rootCid = await client.put(files);
  console.log(rootCid);
  return rootCid;
  console.log("MIDI file uploaded to Web3.Storage");
};

const uploadJsonToInfura = async (data) => {
  console.log("Uploading JSON file to Infura");
  const blob = new Blob([data], { type: "application/json" });
  const files = [new File([blob], "metadata.json")];
  const client = new Web3Storage({ token: process.env.FILECOIN_API_KEY });
  const rootCid = await client.put(files);
  console.log(rootCid);
  return rootCid + "/metadata.json";
};

const uploadJson = (data) => {
  const serialized = JSON.stringify(data);

  const url = uploadJsonToInfura(serialized);

  return url;
};

module.exports = {
  text2Emotion,
  mood2Notes,
  data2Midi,
  uploadJsonToInfura,
  postsByHandle,
  uploadMidiFileToInfura,
};
