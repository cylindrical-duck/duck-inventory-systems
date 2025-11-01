import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Package, TrendingUp } from "lucide-react";
import { Order } from "@/pages/Orders";

interface OrderStatsProps {
  orders: Order[];
}

const OrderStats = ({ orders }: OrderStatsProps) => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      gradient: "from-primary to-accent",
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-accent to-warning",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Package,
      gradient: "from-warning to-primary",
    },
    {
      title: "Avg Order Value",
      value: `$${avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      gradient: "from-primary/80 to-accent/80",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r bg-clip-text text-transparent from-foreground to-primary">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} opacity-10`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div
              className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${stat.gradient}`}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrderStats;
