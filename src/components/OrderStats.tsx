import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Package, TrendingUp } from "lucide-react";
import { Order } from "@/pages/Orders";
import { useBranding } from "../context/BrandingContext"; // <-- 1. IMPORT HOOK

interface OrderStatsProps {
  orders: Order[];
}

const OrderStats = ({ orders }: OrderStatsProps) => {
  // --- 2. GET BRANDING COLORS ---
  const { primaryColor, accentColor } = useBranding();

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Package,
    },
    {
      title: "Avg Order Value",
      value: `$${avgOrderValue.toFixed(2)}`,
      icon: TrendingUp,
    },
  ];

  // --- 3. DEFINE DYNAMIC COLORS AND GRADIENTS ---
  const mainColors = [primaryColor, accentColor, primaryColor, accentColor];
  const gradients = [
    `linear-gradient(to br, ${primaryColor}, ${accentColor})`,
    `linear-gradient(to br, ${accentColor}, ${primaryColor})`,
    `linear-gradient(to br, ${primaryColor}, ${accentColor})`,
    `linear-gradient(to br, ${accentColor}, ${primaryColor})`,
  ];


  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
          // --- 4. APPLY DYNAMIC BORDER ---
          style={{ borderColor: `${mainColors[index]}` }} // 33 is ~20% opacity
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                {/* --- 4. APPLY DYNAMIC TEXT GRADIENT --- */}
                <p
                  className="text-3xl font-bold mt-2 bg-gradient-to-r bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, hsl(var(--foreground)), ${mainColors[index]})`,
                  }}
                >
                  {stat.value}
                </p>
              </div>
              {/* --- 4. APPLY DYNAMIC ICON CONTAINER --- */}
              <div
                className="p-3 rounded-lg"
                style={{ background: gradients[index], opacity: 0.1 }}
              >
                {/* Icon itself should inherit color or be white, leave as is */}
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            {/* --- 4. APPLY DYNAMIC BOTTOM BORDER --- */}
            <div
              className="absolute bottom-0 left-0 h-1 w-full"
              style={{ background: gradients[index] }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrderStats;