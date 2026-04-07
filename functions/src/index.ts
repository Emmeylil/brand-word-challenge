import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const verifyWin = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { roundId, guessedLetters } = data;

  if (!roundId || !guessedLetters || !Array.isArray(guessedLetters)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required arguments."
    );
  }

  // Fetch the round from Firestore
  const roundRef = db.collection("rounds").doc(roundId);
  const roundSnap = await roundRef.get();

  if (!roundSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Round not found."
    );
  }

  const roundData = roundSnap.data() as { word: string; revealedIndices: number[] };
  const wordLetters = new Set(roundData.word.toUpperCase().split(""));
  const revealedLetters = new Set(
    roundData.revealedIndices.map((i: number) => roundData.word[i].toUpperCase())
  );

  const guessedSet = new Set(guessedLetters.map((l: string) => l.toUpperCase()));

  // Check if all letters have been discovered
  const allFound = [...wordLetters].every(
    (l) => guessedSet.has(l) || revealedLetters.has(l)
  );

  if (!allFound || guessedSet.size === 0) {
    return { success: false, message: "Word not fully guessed." };
  }

  const userEmail = context.auth.token.email;
  const userName = context.auth.token.name || userEmail?.split("@")[0] || "Player";

  if (!userEmail) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User email not found in auth token."
    );
  }

  // Update score securely
  const scoreRef = db.collection("leaderboard").doc(userEmail);
  
  await db.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
    const docSnap = await transaction.get(scoreRef);
    let newScore = 1;
    if (docSnap.exists) {
        newScore = (docSnap.data()?.score || 0) + 1;
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
