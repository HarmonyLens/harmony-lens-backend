const express = require("express");
const app = express();
const { text2Emotion } = require("./utils");

// respond with "hello world" when a GET request is made to the homepage
app.get("/emotion", (req, res) => {
  const { text } = req.query;

  text2Emotion(text).then((data) => {
    res.send(data);
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000, () => console.log("Example app listening on port 3000!"));
