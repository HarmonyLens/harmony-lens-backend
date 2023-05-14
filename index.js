const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const {
  text2Emotion,
  uploadJsonToInfura,
  mood2Notes,
  uploadMidiFileToInfura,
  data2Midi,
} = require("./utils");

const containKeyword = "ipfs";

app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser.json());
// respond with "hello world" when a GET request is made to the homepage
app.get("/emotion", (req, res) => {
  const { text } = req.query;

  text2Emotion(text).then((data) => {
    res.send(data);
  });
});

app.get("/emotionOfHandle", (req, res) => {
  console.log(req.query.handle);
  const handle = req.query.handle;
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
            const data = await response.json();
            return data.content;
          } catch (e) {
            console.log(e);
          }
        })
      );

      const combined = texts.join(" ");

      const emotion = await text2Emotion(combined, true);

      res.send(emotion);
    });
});

app.get("/users", (req, res) => {
  const query = `{
    posts(first: 5 where:{contentURI_contains: "${containKeyword}"}) {
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

app.get("/posts", (req, res) => {
  const handle = req.query.handle;
  const query = `{
    posts(
        first: 5
        where: { and: [{profileId_: {handle: "${handle}"}}, {contentURI_contains: "${containKeyword}"}] }
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

app.get("/notes", (req, res) => {
  const { mood } = req.query;
  mood2Notes(mood).then((data) => {
    res.send(data);
  });
});

app.post("/create", async (req, res) => {
  const notes = req.body;
  const song = data2Midi(notes);
  const uri = await uploadMidiFileToInfura(song);
  res.send({ uri });
});

app.post("/upload", async (req, res) => {
  const data = req.body;
  const uri = await uploadJsonToInfura(JSON.stringify(data));
  console.log(uri);
  res.send({ uri });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000, () => console.log("Example app listening on port 3000!"));
