import { useEffect, useState } from "react";

const colors = [
  "hsl(12 80% 65%)",
  "hsl(45 90% 65%)",
  "hsl(150 60% 50%)",
  "hsl(270 40% 60%)",
  "hsl(0 0% 98%)",
];

interface Particle {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
}

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const p: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
    }));
    setParticles(p);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${2 + Math.random()}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
