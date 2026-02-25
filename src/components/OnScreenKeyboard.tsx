interface Props {
  onKey: (letter: string) => void;
  usedLetters: Set<string>;
  disabled: boolean;
}

const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export function OnScreenKeyboard({ onKey, usedLetters, disabled }: Props) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-md mx-auto">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-1 sm:gap-1.5 justify-center">
          {row.split("").map((letter) => (
            <button
              key={letter}
              onClick={() => onKey(letter)}
              disabled={disabled || usedLetters.has(letter)}
              className={`key-btn ${usedLetters.has(letter) ? "key-btn-used" : ""}`}
            >
              {letter}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
