const { Web3Storage } = require("web3.storage");
const { File } = require("@web-std/file");
const {
  text2Emotion,
  mood2Notes,
  data2Midi,
  postsByHandle,
} = require("./utils");
require("dotenv").config();

const uploadMidiFileToInfura = async (data) => {
  console.log("Uploading MIDI file to Infura");
  const blob = new Blob([data], { type: "application/json" });
  const files = [new File([blob], "audio.mid")];
  const client = new Web3Storage({ token: process.env.FILECOIN_API_KEY });
  const rootCid = await client.put(files);
  console.log(rootCid);
  console.log("MIDI file uploaded to Web3.Storage");
};

postsByHandle("alptoksoz.eth").then((res) => {
  text2Emotion(res, false).then((res) => {
    mood2Notes(res).then((res) => {
      const data = data2Midi(res);
      uploadMidiFileToInfura(data);
    });
  });
});

// module.exports = { createMidiFile };
