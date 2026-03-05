
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Users, ShieldCheck, Package } from "lucide-react";
import { adminDb } from "@/lib/firebase/admin";

async function getStats() {
    const usersSnapshot = adminDb.collection('users').get();
    const huntsSnapshot = adminDb.collection('hunts').get();
    const pendingHuntsSnapshot = adminDb.collection('hunts').where('status', '==', 'pending').get();

    const [users, hunts, pendingHunts] = await Promise.all([
        usersSnapshot,
        huntsSnapshot,
        pendingHuntsSnapshot,
    ]);

    return {
        totalUsers: users.size,
        totalHunts: hunts.size,
        pendingApprovals: pendingHunts.size
    }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-8">Admin Overview</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Hunters, Outfitters, and Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hunts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHunts}</div>
            <p className="text-xs text-muted-foreground">Across all statuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Hunts awaiting review</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
