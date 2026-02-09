const admin = require("firebase-admin");
require('dotenv').config();

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped newlines for correct private key formatting
                privateKey: process.env.FIREBASE_PRIVATE_KEY
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
                    : undefined,
            }),
        });
        console.log("Firebase Project:", process.env.FIREBASE_PROJECT_ID);
    } catch (error) {
        console.error("Firebase initialization error:", error.message);
    }
}

module.exports = admin;
