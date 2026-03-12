import { requireArtist } from "@/modules/auth/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, ShoppingBag, Package } from "lucide-react";

export default async function EarningsPage() {
  const user = await requireArtist();
  const artistId = user.artistId!;

  const [totalRevenue, orderCount, recentOrders, topProducts] =
    await Promise.all([
      prisma.orderItem.aggregate({
        where: { artistId },
        _sum: { unitPrice: true },
      }),
      prisma.orderItem.count({ where: { artistId } }),
      prisma.orderItem.findMany({
        where: { artistId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          order: { select: { id: true, status: true, createdAt: true } },
        },
      }),
      prisma.orderItem.groupBy({
        by: ["productName"],
        where: { artistId },
        _sum: { unitPrice: true },
        _count: true,
        orderBy: { _sum: { unitPrice: "desc" } },
        take: 5,
      }),
    ]);

  const revenue = Number(totalRevenue._sum.unitPrice) || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Earnings</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(revenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-400 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Total Sales</p>
                <p className="text-2xl font-bold mt-1">{orderCount}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-green-400 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">Avg. Sale</p>
                <p className="text-2xl font-bold mt-1">
                  {orderCount > 0
                    ? formatCurrency(revenue / orderCount)
                    : "$0.00"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-4">Top Products</CardTitle>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-neutral-700 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">No sales yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((item: { productName: string; _sum: { unitPrice: unknown }; _count: number }, i: number) => (
                  <div
                    key={item.productName}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-neutral-600 w-5">
                        {i + 1}.
                      </span>
                      <span className="text-sm truncate">
                        {item.productName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-xs text-neutral-500">
                        {item._count} sales
                      </span>
                      <span className="text-sm font-medium text-amber-400">
                        {formatCurrency(Number(item._sum.unitPrice) || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-4">Recent Orders</CardTitle>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingBag className="h-8 w-8 text-neutral-700 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((item: { id: string; productName: string; unitPrice: unknown; createdAt: Date; order: { id: string; status: string; createdAt: Date } }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate">{item.productName}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-medium text-amber-400 flex-shrink-0">
                      {formatCurrency(Number(item.unitPrice))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
