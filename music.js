const {
  text2Emotion,
  mood2Notes,
  data2Midi,
  postsByHandle,
  uploadMidiFileToInfura,
} = require("./utils");
require("dotenv").config();

postsByHandle("alptoksoz.eth").then((res) => {
  text2Emotion(res, false).then((res) => {
    mood2Notes(res).then((res) => {
      const data = data2Midi(res);
      uploadMidiFileToInfura(data);
    });
  });
});

// module.exports = { createMidiFile };
