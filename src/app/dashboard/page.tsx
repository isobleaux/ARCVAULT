import { requireArtist } from "@/modules/auth/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Music, Package, DollarSign, Play } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireArtist();

  const [trackCount, productCount, totalPlays, totalRevenue] =
    await Promise.all([
      prisma.track.count({ where: { artistId: user.artistId! } }),
      prisma.digitalProduct.count({ where: { artistId: user.artistId! } }),
      prisma.track.aggregate({
        where: { artistId: user.artistId! },
        _sum: { playCount: true },
      }),
      prisma.orderItem.aggregate({
        where: { artistId: user.artistId! },
        _sum: { unitPrice: true },
      }),
    ]);

  const stats = [
    {
      label: "Tracks",
      value: trackCount,
      icon: Music,
      color: "text-blue-400",
    },
    {
      label: "Products",
      value: productCount,
      icon: Package,
      color: "text-green-400",
    },
    {
      label: "Total Plays",
      value: totalPlays._sum.playCount || 0,
      icon: Play,
      color: "text-purple-400",
    },
    {
      label: "Revenue",
      value: `$${(Number(totalRevenue._sum.unitPrice) || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-amber-400",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-4">Quick Actions</CardTitle>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/dashboard/music/upload"
                className="flex items-center gap-3 rounded-lg border border-neutral-800 p-3 hover:bg-neutral-800/50 transition-colors"
              >
                <Music className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Upload a Track</p>
                  <p className="text-xs text-neutral-500">
                    Share your music with the world
                  </p>
                </div>
              </a>
              <a
                href="/dashboard/products/new"
                className="flex items-center gap-3 rounded-lg border border-neutral-800 p-3 hover:bg-neutral-800/50 transition-colors"
              >
                <Package className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Create a Product</p>
                  <p className="text-xs text-neutral-500">
                    Sell beats, samples, and more
                  </p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-4">Getting Started</CardTitle>
          <CardContent>
            <div className="space-y-3 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    trackCount > 0 ? "bg-green-500" : "bg-neutral-600"
                  }`}
                />
                Upload your first track
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    productCount > 0 ? "bg-green-500" : "bg-neutral-600"
                  }`}
                />
                Create a digital product
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-neutral-600" />
                Connect your Stripe account
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-neutral-600" />
                Publish your profile
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
