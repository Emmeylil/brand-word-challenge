import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
    id: string;
    name: string;
    score: number;
}

export function Leaderboard() {
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "leaderboard"),
            orderBy("score", "desc"),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const entries: LeaderboardEntry[] = [];
            snapshot.forEach((doc) => {
                entries.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
            });
            setLeaders(entries);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <Card className="w-full max-w-md mx-auto mt-8">
                <CardContent className="p-8 text-center text-muted-foreground">
                    Loading leaderboard...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto mt-8 shadow-lg border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
                    <Trophy className="text-primary w-6 h-6" />
                    Top Performers
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {leaders.map((entry, index) => (
                        <div
                            key={entry.id}
                            className={`flex items-center justify-between p-4 px-6 ${index === 0 ? "bg-primary/5" : ""
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-8 flex justify-center items-center">
                                    {index === 0 ? (
                                        <Trophy className="text-yellow-500 w-5 h-5" />
                                    ) : index === 1 ? (
                                        <Medal className="text-slate-400 w-5 h-5" />
                                    ) : index === 2 ? (
                                        <Award className="text-amber-600 w-5 h-5" />
                                    ) : (
                                        <span className="text-muted-foreground font-bold">{index + 1}</span>
                                    )}
                                </div>
                                <div className="font-semibold">{entry.name}</div>
                            </div>
                            <div className="font-black text-primary text-lg">{entry.score}</div>
                        </div>
                    ))}
                    {leaders.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            No scores yet. Be the first!
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
