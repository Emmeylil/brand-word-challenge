import { useState, useEffect, useCallback } from "react";
import { campaigns, getBadge, type GameRound } from "@/lib/gameData";
import { WordDisplay } from "./WordDisplay";
import { OnScreenKeyboard } from "./OnScreenKeyboard";
import { Timer } from "./Timer";
import { Confetti } from "./Confetti";

type GameState = "playing" | "won" | "lost";

export function GameScreen() {
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
      setTotalWins((p) => p + 1);
    }
  }, [guessedLetters, round, gameState]);

  // Keyboard input
  useEffect(() => {
    if (gameState !== "playing" || showIntro) return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) handleGuess(key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameState, showIntro, guessedLetters]);

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

  const badge = getBadge(totalWins);
  const currentRoundNum = (roundIndex % campaigns.length) + 1;

  if (showIntro) {
    return (
      <div className="min-h-screen game-gradient flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-8 animate-pop-in">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight">
            <span className="text-primary">play</span>able
          </h1>
          <p className="text-lg text-muted-foreground max-w-xs mx-auto">
            Guess the hidden word before time runs out. Ready?
          </p>
          <button
            onClick={() => {
              setShowIntro(false);
              resetRound(0);
            }}
            className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg
              hover:brightness-110 active:scale-95 transition-all animate-pulse-glow"
          >
            Start Playing
          </button>
        </div>
      </div>
    );
  }

  if (gameState === "won") {
    return (
      <div className="min-h-screen game-gradient flex flex-col items-center justify-center px-4">
        <Confetti />
        <div className="text-center space-y-6 animate-pop-in">
          {badge && (
            <div className="text-6xl">{badge.emoji}</div>
          )}
          <h2 className="text-3xl sm:text-4xl font-black text-success">
            🎉 You got it!
          </h2>
          <p className="text-xl font-bold">
            The word was <span className="text-primary">{round.word}</span>
          </p>
          {badge && (
            <div className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground font-bold text-sm">
              Badge unlocked: {badge.name} {badge.emoji}
            </div>
          )}
          <p className="text-muted-foreground text-sm">
            Round {currentRoundNum} / {campaigns.length} · {totalWins} correct
          </p>
          <div className="flex gap-3 justify-center pt-2">
            {roundIndex < campaigns.length - 1 ? (
              <button
                onClick={nextRound}
                className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold
                  hover:brightness-110 active:scale-95 transition-all"
              >
                Next Round →
              </button>
            ) : (
              <button
                onClick={replay}
                className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold
                  hover:brightness-110 active:scale-95 transition-all"
              >
                Play Again 🔄
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "lost") {
    return (
      <div className="min-h-screen game-gradient flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6 animate-pop-in">
          <div className="text-6xl">⏰</div>
          <h2 className="text-3xl font-black text-destructive">Time's up!</h2>
          <p className="text-xl">
            The word was <span className="font-bold text-primary">{round.word}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            {totalWins} word{totalWins !== 1 ? "s" : ""} guessed this session
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => { resetRound(roundIndex); setGameState("playing"); }}
              className="px-6 py-3 rounded-full border border-border text-foreground font-bold
                hover:bg-secondary active:scale-95 transition-all"
            >
              Retry
            </button>
            <button
              onClick={replay}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold
                hover:brightness-110 active:scale-95 transition-all"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen game-gradient flex flex-col items-center px-4 py-6 sm:py-10">
      {/* Logo */}
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
        <span className="text-primary">play</span>able
      </h1>

      {/* Round indicator */}
      <p className="text-xs text-muted-foreground mb-8 font-semibold">
        Round {currentRoundNum} / {campaigns.length}
      </p>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-lg">
        {/* Hint */}
        <p className="text-lg sm:text-xl text-center font-semibold text-foreground/90">
          {round.hint}
        </p>

        {/* Word */}
        <WordDisplay
          word={round.word}
          revealedIndices={round.revealedIndices}
          guessedLetters={guessedLetters}
          shake={shake}
          won={false}
        />

        {/* Keyboard */}
        <OnScreenKeyboard
          onKey={handleGuess}
          usedLetters={guessedLetters}
          disabled={gameState !== "playing"}
        />

        {/* Timer */}
        <Timer timeLeft={timeLeft} totalTime={round.timeLimit} />
      </div>
    </div>
  );
}
