const express = require("express");
const cors = require("cors");
const admin = require("../firebaseadmin");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'https://oudi-8baa4.web.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

app.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Server is working",
    firebaseInitialized: admin.apps.length > 0,
    env: {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasBucket: !!process.env.FIREBASE_STORAGE_BUCKET
    }
  });
});

app.get("/test-firestore", async (req, res) => {
  try {
    const testRef = await admin.firestore().collection("posts").limit(1).get();
    res.json({ success: true, works: true, count: testRef.size });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

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
      shoppingLink,
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
      shoppingLink: Array.isArray(shoppingLink)
        ? shoppingLink
        : shoppingLink
        ? [shoppingLink]
        : [],

      imageUrl: finalImageUrl,
      imageBase64: "", // security

      userId,
      username,
      userAvatar: userAvatar || "",

      likedBy: [],
      likes: 0,
      ratings: {},
      timestamp: Date.now(),
      isPinned: false
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

app.get("/posts/user/:uid", async (req, res) => {
    try {
        const userId = req.params.uid;
        const { isPinned, limit, startDate, endDate } = req.query;

        let query = admin.firestore().collection("posts")
            .where("userId", "==", userId)
            // Order posts by timestamp descending (most recent first)
            .orderBy("timestamp", "desc");

        // 1. PINNED FILTER (for profile page PINS section)
        if (isPinned === 'true') {
            // Assuming you add an 'isPinned' boolean field to your post documents.
            query = query.where("isPinned", "==", true);
        }

        // 2. LIMIT (for profile page MY DIARY RECENTS section)
        if (limit) {
            const numLimit = parseInt(limit, 10);
            if (!isNaN(numLimit) && numLimit > 0) {
                query = query.limit(numLimit);
            }
        }
        
        // 3. DATE RANGE FILTER (for diary calendar)
        if (startDate && endDate) {
            // Convert YYYY-MM-DD to milliseconds timestamp for Firestore range query
            const startMs = new Date(startDate).getTime();
            // End Date needs to be the end of the day, so we add 1 day and subtract 1 ms
            const endMs = new Date(endDate);
            endMs.setDate(endMs.getDate() + 1);
            const endMsAdjusted = endMs.getTime() - 1; 

            query = query
                .where("timestamp", ">=", startMs)
                .where("timestamp", "<=", endMsAdjusted);
        }

        const snap = await query.get();
        const posts = snap.docs.map(doc => {
            const data = doc.data();
            
            // Calculate average rating
            const ratings = data.ratings || {};
            const ratingValues = Object.values(ratings);
            const avgRating = ratingValues.length > 0 
                ? (ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length).toFixed(1)
                : null;

            return { 
                id: doc.id, 
                ...data, 
                // Add the averaged rating and total likes directly to the response object
                rating: avgRating, 
                likes: data.likedBy ? data.likedBy.length : 0,
                // Ensure date is included for the calendar logic to work
                date: data.timestamp 
            };
        });
        
        res.json({ success: true, posts });

    } catch (err) {
        console.error(`Error fetching user posts for ${req.params.uid}:`, err);
        res.status(500).json({ success: false, error: "Failed to retrieve user posts." });
    }
});

app.put("/posts/:id/pin", async (req, res) => {
    try {
        const postId = req.params.id;
        const { isPinned } = req.body; // Expects true or false

        if (typeof isPinned !== 'boolean') {
            return res.status(400).json({ success: false, error: "Missing or invalid 'isPinned' boolean value." });
        }

        const ref = admin.firestore().collection("posts").doc(postId);
        await ref.update({ isPinned });

        res.json({ success: true, isPinned });

    } catch (err) {
        console.error("Pin status update error:", err);
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

app.delete('/friends/remove', async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        
        if (!userId || !friendId) {
            return res.status(400).json({ success: false, error: 'Missing user or friend ID.' });
        }

        const db = admin.firestore();
        const batch = db.batch();

        // 1. Find the relationship document from the current user (userId -> friendId)
        const snap1 = await db.collection("friends")
            .where("userId", "==", userId)
            .where("friendId", "==", friendId)
            .get();

        // 2. Find the reciprocal relationship document (friendId -> userId)
        const snap2 = await db.collection("friends")
            .where("userId", "==", friendId)
            .where("friendId", "==", userId)
            .get();

        // Check if any documents were found (it should find both if the relationship is mutual)
        if (snap1.empty && snap2.empty) {
            return res.status(404).json({ success: false, error: "Friendship documents not found." });
        }
        
        // 3. Add all found documents to the batch for deletion
        snap1.forEach(doc => batch.delete(doc.ref));
        snap2.forEach(doc => batch.delete(doc.ref));

        // 4. Commit the deletion batch
        await batch.commit();

        res.status(200).json({ success: true, message: 'Friendship successfully removed.' });
        
    } catch (error) {
        console.error('Error removing friendship documents:', error);
        res.status(500).json({ success: false, error: 'Server error during removal.' });
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

module.exports = app;