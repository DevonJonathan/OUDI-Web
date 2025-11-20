const express = require("express");
const cors = require("cors");
const admin = require("./firebaseadmin");

const app = express();

app.use(cors());
app.use(express.json());

// Signup API
app.post("/signup", async (req, res) => {
  try {
    const { email, password, username, bio } = req.body;

    // 1. Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password
    });

    // 2. Create user profile in Firestore
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      username,
      bio: bio ?? "",
      createdAt: Date.now()
    });

    res.json({ success: true, uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Login API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const fetch = (await import("node-fetch")).default;

    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBqiy96uKfnAxkXJPXwAidH8vpqA4DOSto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      }
    );

    const data = await resp.json();

    if (data.error) {
      return res.status(400).json({ success: false, error: data.error.message });
    }

    res.json({ success: true, token: data.idToken, uid: data.localId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POSTS API

// Get all posts
app.get("/posts", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("posts").get();
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Like / Unlike post
app.put("/posts/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const postRef = admin.firestore().collection("posts").doc(req.params.id);
    const post = await postRef.get();

    if (!post.exists)
      return res.status(404).json({ success: false, error: "Post not found" });

    const data = post.data();
    let likedBy = data.likedBy || [];

    if (likedBy.includes(userId)) {
      // Unlike
      likedBy = likedBy.filter(uid => uid !== userId);
    } else {
      // Like
      likedBy.push(userId);
    }

    await postRef.update({
      likedBy,
      likes: likedBy.length
    });

    res.json({ success: true, likes: likedBy.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Rate post
app.put("/posts/:id/rate", async (req, res) => {
  try {
    const { userId, rating } = req.body;

    const postRef = admin.firestore().collection("posts").doc(req.params.id);
    const post = await postRef.get();

    if (!post.exists)
      return res.status(404).json({ success: false, error: "Post not found" });

    const data = post.data();
    let ratings = data.ratings || {};

    ratings[userId] = rating;

    await postRef.update({ ratings });

    res.json({ success: true, ratings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));