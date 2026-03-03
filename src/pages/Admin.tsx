import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Mail, TrendingUp, Plus, Trash2, ListChecks, Download } from "lucide-react";
import { toast } from "sonner";

interface UserRecord {
    id: string;
    name: string;
    email: string;
    score: number;
}

interface GameRoundRecord {
    id: string;
    word: string;
    hint: string;
    timeLimit: number;
    revealedIndices: number[];
}

export default function Admin() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [rounds, setRounds] = useState<GameRoundRecord[]>([]);
    const [newWord, setNewWord] = useState("");
    const [newHint, setNewHint] = useState("");
    const [newTimeLimit, setNewTimeLimit] = useState("40");

    useEffect(() => {
        const usersQuery = query(collection(db, "leaderboard"), orderBy("score", "desc"));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const records: UserRecord[] = [];
            snapshot.forEach((doc) => {
                records.push({ id: doc.id, ...doc.data() } as UserRecord);
            });
            setUsers(records);
        });

        const roundsQuery = query(collection(db, "rounds"), orderBy("createdAt", "asc"));
        const unsubscribeRounds = onSnapshot(roundsQuery, (snapshot) => {
            const records: GameRoundRecord[] = [];
            snapshot.forEach((doc) => {
                records.push({ id: doc.id, ...doc.data() } as GameRoundRecord);
            });
            setRounds(records);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeRounds();
        };
    }, []);

    const handleAddRound = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWord || !newHint) return;

        try {
            const word = newWord.toUpperCase().trim();
            // Automatically reveal the first letter or some random indices
            const revealedIndices = [0];

            await addDoc(collection(db, "rounds"), {
                word,
                hint: newHint,
                timeLimit: parseInt(newTimeLimit) || 40,
                revealedIndices,
                createdAt: serverTimestamp(),
            });

            setNewWord("");
            setNewHint("");
            toast.success("Round added successfully!");
        } catch (error) {
            console.error("Error adding round:", error);
            toast.error("Failed to add round.");
        }
    };

    const handleDeleteRound = async (id: string) => {
        if (!confirm("Are you sure you want to delete this round?")) return;
        try {
            await deleteDoc(doc(db, "rounds", id));
            toast.success("Round deleted.");
        } catch (error) {
            console.error("Error deleting round:", error);
            toast.error("Failed to delete round.");
        }
    };

    const handleExportCSV = () => {
        if (users.length === 0) {
            toast.error("No player data to export.");
            return;
        }

        const headers = ["Name", "Email", "Score"];
        const csvRows = [
            headers.join(","),
            ...users.map(u => `${u.name},${u.email},${u.score}`)
        ];

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `jumia_game_players_${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Player data exported!");
    };

    return (
        <div className="min-h-screen bg-secondary/30 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-10">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-primary/10 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-primary tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground font-medium">Manage game rounds and track players</p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="bg-primary/5 hover:bg-primary/10 border-primary/10 font-bold"
                            onClick={handleExportCSV}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                        </Button>
                        <div className="bg-primary/5 p-3 px-5 rounded-xl flex items-center gap-3 border border-primary/10">
                            <Users className="text-primary w-5 h-5" />
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total Players</p>
                                <p className="font-black text-xl leading-none">{users.length}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Round Creator Form */}
                    <div className="md:col-span-1">
                        <Card className="shadow-sm border border-primary/10 sticky top-8">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Plus className="text-primary w-5 h-5" />
                                    New Round
                                </CardTitle>
                                <CardDescription>Add a new word to the game</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleAddRound}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="word">The Word</Label>
                                        <Input
                                            id="word"
                                            placeholder="e.g. orange"
                                            value={newWord}
                                            onChange={(e) => setNewWord(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hint">The Hint</Label>
                                        <Input
                                            id="hint"
                                            placeholder="e.g. Marketplace in Africa"
                                            value={newHint}
                                            onChange={(e) => setNewHint(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="time">Time Limit (Sec)</Label>
                                        <Input
                                            id="time"
                                            type="number"
                                            value={newTimeLimit}
                                            onChange={(e) => setNewTimeLimit(e.target.value)}
                                            required
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full font-bold">Create Round</Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>

                    {/* Round List & Player Standings */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Rounds Table */}
                        <Card className="shadow-sm border border-primary/10">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <ListChecks className="text-primary w-5 h-5" />
                                        Active Rounds
                                    </CardTitle>
                                    <CardDescription>Words currently in rotation</CardDescription>
                                </div>
                                <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                    {rounds.length} Rounds
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Word</TableHead>
                                            <TableHead>Hint</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rounds.map((round) => (
                                            <TableRow key={round.id}>
                                                <TableCell className="font-black text-primary tracking-widest">{round.word}</TableCell>
                                                <TableCell className="text-sm italic">{round.hint}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteRound(round.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {rounds.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center p-8 text-muted-foreground italic">
                                                    No rounds added. The game will use default values.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Players Table (Existing) */}
                        <Card className="shadow-sm border border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <TrendingUp className="text-primary w-5 h-5" />
                                    Player Standings
                                </CardTitle>
                                <CardDescription>Top scores recorded in real-time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Player</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-bold">{user.name}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-black text-primary">
                                                    {user.score}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
