const express = require("express");
const cors = require("cors");
const admin = require("./firebaseadmin");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

function parseBase64Image(base64String) {
  if (!base64String || typeof base64String !== "string") {
    throw new Error("Invalid image string");
  }

  // Auto-inject MIME header if missing
  if (!base64String.startsWith("data:")) {
    base64String = "data:image/jpeg;base64," + base64String;
  }

  const parts = base64String.split(",");
  if (parts.length !== 2) throw new Error("Malformed base64 data URI");

  const mimeMatch = parts[0].match(/data:(.*);base64/);
  const contentType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const buffer = Buffer.from(parts[1], "base64");

  let ext = contentType.split("/")[1];
  if (!ext) ext = "jpg";

  return { buffer, contentType, ext };
}

async function uploadImageToStorage(base64String, destPath) {
  const bucket = admin.storage().bucket();
  const file = bucket.file(destPath);

  const { buffer, contentType } = parseBase64Image(base64String);
  const token = uuidv4();

  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: { firebaseStorageDownloadTokens: token }
    },
    public: true,
    validation: "md5"
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destPath)}?alt=media&token=${token}`;
}

function looksLikeUrl(s) {
  return typeof s === "string" && /^https?:\/\//i.test(s);
}


app.get("/api/users", (req, res) => {
  res.json({ success: true, message: "Users list from server!" });
});

app.post("/signup", async (req, res) => {
  try {
    const { email, password, username, bio } = req.body;

    const userRecord = await admin.auth().createUser({ email, password });

    await admin.firestore().collection("users")
      .doc(userRecord.uid)
      .set({
        username,
        bio: bio ?? "",
        avatarUrl: null,
        createdAt: Date.now()
      });

    res.json({ success: true, uid: userRecord.uid });

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;
    const { email, password } = req.body;

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

    res.json({
      success: true,
      uid: data.localId,
      token: data.idToken
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const {
      caption,
      theme,
      location,
      shoppingLinks,
      imageBase64,
      userId,
      username,
      userAvatar
    } = req.body;

    if (!userId)
      return res.status(400).json({ success: false, error: "Missing userId" });

    if (!imageBase64)
      return res.status(400).json({ success: false, error: "Image missing" });

    // 🔥 FIXED — ALWAYS UPLOAD THROUGH THE SAFE PARSER
    const filename = `posts/${userId}_${Date.now()}.jpg`;
    const finalImageUrl = await uploadImageToStorage(imageBase64, filename);

    const postData = {
      caption: caption || "",
      theme: theme || "",
      location: location || "",
      shoppingLinks: Array.isArray(shoppingLinks)
        ? shoppingLinks
        : shoppingLinks
        ? [shoppingLinks]
        : [],

      imageUrl: finalImageUrl,
      imageBase64: "", // security

      userId,
      username,
      userAvatar: userAvatar || "",

      likedBy: [],
      likes: 0,
      ratings: {},
      timestamp: Date.now()
    };

    const docRef = await admin.firestore().collection("posts").add(postData);

    res.json({ success: true, id: docRef.id, post: postData });

  } catch (err) {
    console.error("Post upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const snap = await admin.firestore().collection("posts").get();
    const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, posts });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/posts/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;

    const ref = admin.firestore().collection("posts").doc(req.params.id);
    const snap = await ref.get();

    if (!snap.exists)
      return res.status(404).json({ success: false, error: "Post not found" });

    let likedBy = snap.data().likedBy || [];

    if (likedBy.includes(userId)) {
      likedBy = likedBy.filter(u => u !== userId);
    } else {
      likedBy.push(userId);
    }

    await ref.update({ likedBy, likes: likedBy.length });

    res.json({ success: true, likes: likedBy.length });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/posts/:id/rate", async (req, res) => {
  try {
    const { userId, rating } = req.body;

    const ref = admin.firestore().collection("posts").doc(req.params.id);
    const snap = await ref.get();

    if (!snap.exists)
      return res.status(404).json({ success: false, error: "Post not found" });

    const ratings = snap.data().ratings || {};
    ratings[userId] = rating;

    await ref.update({ ratings });

    res.json({ success: true, ratings });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/profile/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const userDoc = await admin.firestore().collection("users").doc(uid).get();

    if (!userDoc.exists)
      return res.status(404).json({ success: false, error: "User not found" });

    const prefsQuery = await admin.firestore()
      .collection("userPreferences")
      .where("userId", "==", uid)
      .limit(1)
      .get();

    let prefs = null;
    if (!prefsQuery.empty) {
      prefs = prefsQuery.docs[0].data();
      delete prefs.userId;
    }

    res.json({
      success: true,
      profile: {
        uid,
        ...userDoc.data(),
        preferences: prefs
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/profile/avatar/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const { avatarUrl } = req.body;

    const userRef = admin.firestore().collection("users").doc(uid);

    if (!avatarUrl) {
      await userRef.set({ avatarUrl: null }, { merge: true });
      return res.json({ success: true, avatarUrl: null });
    }

    if (looksLikeUrl(avatarUrl)) {
      await userRef.set({ avatarUrl }, { merge: true });
      return res.json({ success: true, avatarUrl });
    }

    const filename = `profile/${uid}_${Date.now()}.jpg`;
    const downloadUrl = await uploadImageToStorage(avatarUrl, filename);

    await userRef.set({ avatarUrl: downloadUrl }, { merge: true });

    res.json({ success: true, avatarUrl: downloadUrl });

  } catch (err) {
    console.error("Avatar error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/friends/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const friendSnap = await admin.firestore()
      .collection("friends")
      .where("userId", "==", userId)
      .where("status", "==", "accepted")
      .get();

    const friendIds = friendSnap.docs.map(doc => doc.data().friendId);

    let friends = [];
    if (friendIds.length > 0) {
      const userDocs = await admin.firestore()
        .collection("users")
        .where(admin.firestore.FieldPath.documentId(), "in", friendIds)
        .get();

      friends = userDocs.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    }

    res.json({ success: true, friends });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get("/friends/suggestions/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const friendSnap = await admin.firestore()
      .collection("friends")
      .where("userId", "==", userId)
      .get();

    const friendIds = friendSnap.docs.map(doc => doc.data().friendId);

    const usersSnap = await admin.firestore()
      .collection("users")
      .get();

    const suggestions = usersSnap.docs
      .filter(doc => doc.id !== userId && !friendIds.includes(doc.id))
      .map(doc => ({ uid: doc.id, ...doc.data() }));

    res.json({ success: true, suggestions });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/friends/add", async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.json({ success: false, error: "Missing IDs" });
    }

    // Check if already exists (pending or accepted)
    const existing = await admin.firestore()
      .collection("friends")
      .where("userId", "==", userId)
      .where("friendId", "==", friendId)
      .get();

    if (!existing.empty) {
      return res.json({ success: false, message: "Already requested or friends" });
    }

    await admin.firestore().collection("friends").add({
      userId,
      friendId,
      status: "pending",
      createdAt: Date.now()
    });

    res.json({ success: true, status: "pending" });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/friends/requests/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const snap = await admin.firestore()
      .collection("friends")
      .where("friendId", "==", userId)
      .where("status", "==", "pending")
      .get();

    const requestIds = snap.docs.map(doc => doc.data().userId);

    let requests = [];
    if (requestIds.length > 0) {
      const usersSnap = await admin.firestore()
        .collection("users")
        .where(admin.firestore.FieldPath.documentId(), "in", requestIds)
        .get();

      requests = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    }

    res.json({ success: true, requests });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/friends/accept", async (req, res) => {
  try {
    const { userId, fromId } = req.body;

    const snap = await admin.firestore()
      .collection("friends")
      .where("userId", "==", fromId)
      .where("friendId", "==", userId)
      .where("status", "==", "pending")
      .get();

    if (snap.empty) {
      return res.json({ success: false, error: "Request not found" });
    }

    const batch = admin.firestore().batch();

    snap.forEach(doc => batch.update(doc.ref, { status: "accepted" }));

    // Add reverse friendship
    batch.set(admin.firestore().collection("friends").doc(), {
      userId,
      friendId: fromId,
      status: "accepted",
      createdAt: Date.now()
    });

    await batch.commit();

    res.json({ success: true, accepted: true });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.post("/friends/decline", async (req, res) => {
  try {
    const { userId, fromId } = req.body;

    const snap = await admin.firestore()
      .collection("friends")
      .where("userId", "==", fromId)
      .where("friendId", "==", userId)
      .where("status", "==", "pending")
      .get();

    const batch = admin.firestore().batch();
    snap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ success: true, declined: true });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/onboarding", async (req, res) => {
  try {
    const { userId, heightCm, weightKg, styles } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    const prefsData = {
      userId,
      heightCm: Number(heightCm) || null,
      weightKg: Number(weightKg) || null,
      styles: Array.isArray(styles) ? styles : [],
      preferencesCompleted: true,
      createdAt: Date.now()
    };

    await admin.firestore()
      .collection("userPreferences")
      .doc(userId)
      .set(prefsData, { merge: true });

    res.json({ success: true, preferences: prefsData });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
