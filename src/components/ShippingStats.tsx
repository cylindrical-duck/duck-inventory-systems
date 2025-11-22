import { Card, CardContent } from "@/components/ui/card";
import { Truck, Clock, CheckCircle, Package } from "lucide-react";
import { Shipment } from "@/pages/Shipping";
import { useBranding } from "../context/BrandingContext"; // <-- 1. IMPORT HOOK

interface ShippingStatsProps {
  shipments: Shipment[];
}

const ShippingStats = ({ shipments }: ShippingStatsProps) => {
  // --- 2. GET BRANDING COLORS ---
  const { primaryColor, accentColor } = useBranding();

  const scheduled = shipments.filter(s => s.status === "scheduled").length;
  const inTransit = shipments.filter(s => s.status === "in_transit").length;
  const delivered = shipments.filter(s => s.status === "delivered").length;
  const total = shipments.length;

  // --- 3. DEFINE STATS ARRAY AND COLORS (like OrderStats) ---
  const stats = [
    {
      title: "Total Shipments",
      value: total,
      icon: Package,
    },
    {
      title: "Scheduled",
      value: scheduled,
      icon: Clock,
    },
    {
      title: "In Transit",
      value: inTransit,
      icon: Truck,
    },
    {
      title: "Delivered",
      value: delivered,
      icon: CheckCircle,
    },
  ];

  const mainColors = [primaryColor, accentColor, primaryColor, accentColor];
  const gradients = [
    `linear-gradient(to br, ${primaryColor}, ${accentColor})`,
    `linear-gradient(to br, ${accentColor}, ${primaryColor})`,
    `linear-gradient(to br, ${primaryColor}, ${accentColor})`,
    `linear-gradient(to br, ${accentColor}, ${primaryColor})`,
  ];

  return (
    // --- 4. APPLY STYLING FROM ORDERSTATS ---
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
          style={{ borderColor: `${mainColors[index]}` }} // 33 is ~20% opacity
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p
                  className="text-3xl font-bold mt-2 bg-gradient-to-r bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, hsl(var(--foreground)), ${mainColors[index]})`,
                  }}
                >
                  {stat.value}
                </p>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ background: gradients[index], opacity: 0.1 }}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
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

export default ShippingStats;