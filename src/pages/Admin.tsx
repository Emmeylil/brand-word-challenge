import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Mail, TrendingUp } from "lucide-react";

interface UserRecord {
    id: string;
    name: string;
    email: string;
    score: number;
}

export default function Admin() {
    const [users, setUsers] = useState<UserRecord[]>([]);

    useEffect(() => {
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records: UserRecord[] = [];
            snapshot.forEach((doc) => {
                records.push({ id: doc.id, ...doc.data() } as UserRecord);
            });
            setUsers(records);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-secondary/30 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border">
                    <div>
                        <h1 className="text-3xl font-black text-primary">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage users and track performance</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg flex items-center gap-3">
                            <Users className="text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground">Total Players</p>
                                <p className="font-black text-xl">{users.length}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <Card className="shadow-sm border">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <TrendingUp className="text-primary" />
                            Player Standings
                        </CardTitle>
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
    );
}
