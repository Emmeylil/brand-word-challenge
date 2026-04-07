"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWin = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
exports.verifyWin = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { roundId, guessedLetters } = data;
    if (!roundId || !guessedLetters || !Array.isArray(guessedLetters)) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required arguments.");
    }
    // Fetch the round from Firestore
    const roundRef = db.collection("rounds").doc(roundId);
    const roundSnap = await roundRef.get();
    if (!roundSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Round not found.");
    }
    const roundData = roundSnap.data();
    const wordLetters = new Set(roundData.word.toUpperCase().split(""));
    const revealedLetters = new Set(roundData.revealedIndices.map((i) => roundData.word[i].toUpperCase()));
    const guessedSet = new Set(guessedLetters.map((l) => l.toUpperCase()));
    // Check if all letters have been discovered
    const allFound = [...wordLetters].every((l) => guessedSet.has(l) || revealedLetters.has(l));
    if (!allFound || guessedSet.size === 0) {
        return { success: false, message: "Word not fully guessed." };
    }
    const userEmail = context.auth.token.email;
    const userName = context.auth.token.name || (userEmail === null || userEmail === void 0 ? void 0 : userEmail.split("@")[0]) || "Player";
    if (!userEmail) {
        throw new functions.https.HttpsError("unauthenticated", "User email not found in auth token.");
    }
    // Update score securely
    const scoreRef = db.collection("leaderboard").doc(userEmail);
    await db.runTransaction(async (transaction) => {
        var _a;
        const docSnap = await transaction.get(scoreRef);
        let newScore = 1;
        if (docSnap.exists) {
            newScore = (((_a = docSnap.data()) === null || _a === void 0 ? void 0 : _a.score) || 0) + 1;
        }
        transaction.set(scoreRef, {
            name: userName,
            email: userEmail,
            score: newScore,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
    return { success: true, message: "Win verified and score updated." };
});
//# sourceMappingURL=index.js.map