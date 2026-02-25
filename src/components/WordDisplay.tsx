interface Props {
  word: string;
  revealedIndices: number[];
  guessedLetters: Set<string>;
  shake: boolean;
  won: boolean;
}

export function WordDisplay({ word, revealedIndices, guessedLetters, shake, won }: Props) {
  return (
    <div className={`flex gap-2 sm:gap-3 justify-center ${shake ? "animate-shake" : ""}`}>
      {word.split("").map((letter, i) => {
        const isRevealed = revealedIndices.includes(i);
        const isGuessed = guessedLetters.has(letter);
        const show = isRevealed || isGuessed || won;

        return (
          <div
            key={i}
            className={`letter-box ${show ? (won ? "letter-box-correct" : "letter-box-filled") : ""}`}
            style={show ? { animationDelay: `${i * 0.08}s` } : undefined}
          >
            {show ? letter : ""}
          </div>
        );
      })}
    </div>
  );
}
