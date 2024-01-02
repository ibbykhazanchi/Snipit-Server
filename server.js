const express = require("express");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const utils = require("./utils");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection string
const mongoURI = process.env.MONGO_URI;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint to add a user to the database
app.post("/addUser", async (req, res) => {
  let _client = null;
  try {
    const { botId, accessToken, profile } = req.body;

    const client = new MongoClient(mongoURI);
    _client = client;

    await client.connect();

    const database = client.db("Snipit");
    const collection = database.collection("users");

    const document = {
      _id: botId,
      accessToken: accessToken,
      profile: profile,
    };

    await collection.insertOne(document);

    res.json({ success: true, message: "User added to the database." });
  } catch (error) {
    console.error(error);
    if (error.code == 11000) {
      // duplicate user error
      res.json({ success: true, message: "User already in database" });
    } else {
      res
        .status(500)
        .json({ success: false, message: `Internal Server Error ${error}` });
    }
  } finally {
    if (_client) _client.close();
  }
});

// Endpoint to get an account by bot_id
app.get("/getUser/:botId", async (req, res) => {
  const botId = req.params.botId;
  if (!botId) {
    return res
      .status(400)
      .json({ success: false, message: "Incorrect botId provided" });
  }

  let _client = null;
  try {
    const client = new MongoClient(mongoURI);
    _client = client;
    await client.connect();

    const database = client.db("Snipit");
    const collection = database.collection("users");

    const account = await collection.findOne({ _id: botId });
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.json({ success: true, account: account });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    if (_client) _client.close();
  }
});

// Endpoint to delete an account by bot_id
app.delete("/deleteUser/:botId", async (req, res) => {
  const botId = req.params.botId;
  if (!botId) {
    return res
      .status(400)
      .json({ success: false, message: "Incorrect botId provided" });
  }

  let _client = null;
  try {
    const client = new MongoClient(mongoURI);
    _client = client;
    await client.connect();

    const database = client.db("Snipit");
    const collection = database.collection("users");

    await collection.deleteOne({ _id: botId });
    res.json({ success: true, message: `deleted user ${parsedBotId}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    _client.close();
  }
});

app.post("/authenticateWithNotion/:code", async (req, res) => {
  const code = req.params.code;
  if (!code) {
    return res
      .status(400)
      .json({ success: false, message: "Incorrect code provided" });
  }

  try {
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectURL = process.env.NOTION_REDIRECT_URL;

    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${encoded}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectURL,
      }),
    });

    const data = await response.json();
    const { bot_id, access_token, owner } = data;
    const ownerProfile = utils.createOwnerProfile(owner);
    res.json({
      success: true,
      data: {
        bot_id: bot_id,
        access_token: access_token,
        profile: ownerProfile,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: `Internal Server Error ${error}` });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
