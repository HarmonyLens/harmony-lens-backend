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

app.get("/posts", (req, res) => {
  const handle = req.query.handle;
  const query = `{\n  posts(first: 5 where: {profileId_:{handle:"${handle}"}}) {\n    id\n    pubId\n    profileId {\n      id\n      handle\n    }\n    contentURI\n    timestamp\n  }\n}`;
  const url = "https://api.thegraph.com/subgraphs/name/anudit/lens-protocol";
  fetch(url, {
    method: "POST",
    body: JSON.stringify({ query }),
  })
    .then((response) => response.json())
    .then((data) => {
      res.send(data);
    })
    .catch((error) => console.error(error));
});

app.get("/emotionOfHandle", (req, res) => {
  const handle = req.query.handle;
  const query = `{\n  posts(first: 5 where: {profileId_:{handle:"${handle}"}}) {\n    id\n    pubId\n    profileId {\n      id\n      handle\n    }\n    contentURI\n    timestamp\n  }\n}`;
  const url = "https://api.thegraph.com/subgraphs/name/anudit/lens-protocol";
  fetch(url, {
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
            if (
              post.contentURI.includes("arweave") ||
              post.contentURI.includes("data.lens.phaver")
            ) {
              const data = await response.json();
              return data.content;
            }
          } catch (e) {
            console.log(e);
          }
        })
      );

      const combined = texts.join(" ");

      console.log(combined);
      //   res.send(JSON.stringify(combined));

      const emotion = await text2Emotion(combined, false);

      res.send(emotion);
    });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000, () => console.log("Example app listening on port 3000!"));
