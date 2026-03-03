import { useState, useEffect, useCallback } from "react";
import { campaigns, getBadge, type GameRound } from "@/lib/gameData";
import { WordDisplay } from "./WordDisplay";
import { OnScreenKeyboard } from "./OnScreenKeyboard";
import { Timer } from "./Timer";
import { Confetti } from "./Confetti";
import { useAuth } from "@/contexts/AuthContext";
import { LoginScreen } from "./LoginScreen";
import { Leaderboard } from "./Leaderboard";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { LogOut } from "lucide-react";

type GameState = "playing" | "won" | "lost";

export function GameScreen() {
  const { user, loading, logout } = useAuth();
  const [roundIndex, setRoundIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [shake, setShake] = useState(false);
  const [totalWins, setTotalWins] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  const round: GameRound = campaigns[roundIndex % campaigns.length];

  const resetRound = useCallback((idx: number) => {
    const r = campaigns[idx % campaigns.length];
    setGuessedLetters(new Set());
    setTimeLeft(r.timeLimit);
    setGameState("playing");
    setShake(false);
  }, []);

  useEffect(() => {
    if (showIntro) return;
    resetRound(roundIndex);
  }, [roundIndex, showIntro, resetRound]);

  // Timer
  useEffect(() => {
    if (gameState !== "playing" || showIntro) return;
    if (timeLeft <= 0) {
      setGameState("lost");
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameState, showIntro]);

  // Record score to Firestore
  const updateFirestoreScore = async (newScore: number) => {
    if (!user) return;
    const scoreRef = doc(db, "leaderboard", user.email);
    try {
      const docSnap = await getDoc(scoreRef);
      if (!docSnap.exists() || docSnap.data().score < newScore) {
        await setDoc(scoreRef, {
          name: user.name,
          email: user.email,
          score: newScore,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      console.error("Error updating score:", err);
    }
  };

  // Check win
  useEffect(() => {
    if (gameState !== "playing") return;
    const wordLetters = new Set(round.word.split(""));
    const revealedLetters = new Set(round.revealedIndices.map((i) => round.word[i]));
    const allFound = [...wordLetters].every(
      (l) => guessedLetters.has(l) || revealedLetters.has(l)
    );
    if (allFound && guessedLetters.size > 0) {
      setGameState("won");
      const nextWins = totalWins + 1;
      setTotalWins(nextWins);
      updateFirestoreScore(nextWins);
    }
  }, [guessedLetters, round, gameState, totalWins, user]);

  // Keyboard input
  useEffect(() => {
    if (gameState !== "playing" || showIntro || !user) return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) handleGuess(key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameState, showIntro, guessedLetters, user]);

  const handleGuess = (letter: string) => {
    if (guessedLetters.has(letter) || gameState !== "playing") return;
    const next = new Set(guessedLetters);
    next.add(letter);
    setGuessedLetters(next);

    if (!round.word.includes(letter)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const nextRound = () => {
    setRoundIndex((p) => p + 1);
  };

  const replay = () => {
    setRoundIndex(0);
    setTotalWins(0);
    resetRound(0);
  };

  if (loading) return null;
  if (!user) return <LoginScreen />;

  const badge = getBadge(totalWins);
  const currentRoundNum = (roundIndex % campaigns.length) + 1;

  if (showIntro) {
    return (
      <div className="min-h-screen game-gradient flex flex-col items-center justify-between py-12 px-4">
        <div className="w-full max-w-md flex justify-end">
          <button onClick={logout} className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm font-medium">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
        <div className="text-center space-y-8 animate-pop-in">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight">
            <span className="text-primary">play</span>able
          </h1>
          <div className="space-y-2">
            <p className="text-xl font-bold">Hello, {user.name}!</p>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Guess the hidden word before time runs out to climb the leaderboard.
            </p>
          </div>
          <button
            onClick={() => {
              setShowIntro(false);
              resetRound(0);
            }}
            className="px-12 py-5 rounded-2xl bg-primary text-primary-foreground font-black text-xl
              hover:brightness-110 active:scale-95 transition-all shadow-lg animate-pulse-glow"
          >
            Start Playing
          </button>
        </div>
        <Leaderboard />
      </div>
    );
  }

  if (gameState === "won") {
    return (
      <div className="min-h-screen game-gradient flex flex-col items-center justify-center px-4">
        <Confetti />
        <div className="text-center space-y-6 animate-pop-in bg-white p-8 rounded-3xl shadow-xl border border-primary/10 max-w-md w-full">
          {badge && (
            <div className="text-7xl animate-bounce">{badge.emoji}</div>
          )}
          <h2 className="text-3xl sm:text-4xl font-black text-success">
            🎉 Brilliant!
          </h2>
          <p className="text-xl font-medium">
            The word was <span className="text-primary font-bold">{round.word}</span>
          </p>
          {badge && (
            <div className="inline-block px-5 py-2 rounded-xl bg-primary/10 text-primary font-bold text-sm">
              NEW BADGE: {badge.name}
            </div>
          )}
          <p className="text-muted-foreground text-sm font-medium">
            Round {currentRoundNum} / {campaigns.length} · {totalWins} wins
          </p>
          <div className="flex flex-col gap-3 pt-4">
            {roundIndex < campaigns.length - 1 ? (
              <button
                onClick={nextRound}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black text-lg
                  hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                Next Round
              </button>
            ) : (
              <button
                onClick={replay}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black text-lg
                   hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                Play Again
              </button>
            )}
            <button
              onClick={() => setShowIntro(true)}
              className="text-muted-foreground text-sm font-bold hover:text-primary transition-colors"
            >
              View Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "lost") {
    return (
      <div className="min-h-screen game-gradient flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6 animate-pop-in bg-white p-8 rounded-3xl shadow-xl border border-primary/10 max-w-md w-full">
          <div className="text-7xl">⏰</div>
          <h2 className="text-3xl font-black text-destructive">Times Up!</h2>
          <p className="text-xl font-medium">
            The word was <span className="font-bold text-primary">{round.word}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            Current session score: <span className="font-bold text-foreground">{totalWins}</span>
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={replay}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black text-lg
                hover:brightness-110 active:scale-95 transition-all shadow-md"
            >
              Try Again
            </button>
            <button
              onClick={() => setShowIntro(true)}
              className="text-muted-foreground text-sm font-bold hover:text-primary transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen game-gradient flex flex-col items-center px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="w-full max-w-lg flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-tighter">
            <span className="text-primary">play</span>able
          </h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Round {currentRoundNum} of {campaigns.length}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-bold">SCORE</p>
          <p className="text-2xl font-black text-primary leading-none">{totalWins}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full max-w-lg">
        {/* Hint */}
        <div className="text-center space-y-2">
          <p className="text-xs font-black text-primary/60 tracking-widest uppercase">The Hint</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {round.hint}
          </p>
        </div>

        {/* Word */}
        <WordDisplay
          word={round.word}
          revealedIndices={round.revealedIndices}
          guessedLetters={guessedLetters}
          shake={shake}
          won={false}
        />

        {/* Keyboard */}
        <div className="w-full max-w-sm">
          <OnScreenKeyboard
            onKey={handleGuess}
            usedLetters={guessedLetters}
            disabled={gameState !== "playing"}
          />
        </div>

        {/* Timer */}
        <div className="w-full max-w-xs mt-4">
          <Timer timeLeft={timeLeft} totalTime={round.timeLimit} />
        </div>
      </div>
    </div>
  );
}
