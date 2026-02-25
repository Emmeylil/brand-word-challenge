interface Props {
  timeLeft: number;
  totalTime: number;
}

export function Timer({ timeLeft, totalTime }: Props) {
  const pct = (timeLeft / totalTime) * 100;
  const urgent = timeLeft <= 10;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`text-5xl font-black tabular-nums ${urgent ? "text-destructive" : "text-foreground"}`}>
        {timeLeft}
      </span>
      <div className="w-40 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${urgent ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground font-semibold">Time left</span>
    </div>
  );
}
