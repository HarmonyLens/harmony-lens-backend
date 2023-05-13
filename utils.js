const dotenv = require("dotenv");
dotenv.config();

function text2Emotion(text, mock = true) {
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
      .catch((error) => console.error(error));
  }
}

module.exports = { text2Emotion };
