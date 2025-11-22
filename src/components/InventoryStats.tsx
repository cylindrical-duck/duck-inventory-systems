import { Card, CardContent } from "@/components/ui/card";
import { Package, Boxes, AlertTriangle, TrendingUp } from "lucide-react";
import { useBranding } from "../context/BrandingContext"; // <-- 1. IMPORT HOOK

interface InventoryStatsProps {
  totalItems: number;
  rawMaterials: number;
  finishedProducts: number;
  lowStock: number;
}

export const InventoryStats = ({
  totalItems,
  rawMaterials,
  finishedProducts,
  lowStock,
}: InventoryStatsProps) => {
  // --- 2. GET BRANDING COLORS ---
  const { primaryColor, accentColor } = useBranding();

  // --- 3. DEFINE STATS ARRAY AND COLORS (like OrderStats) ---
  const stats = [
    {
      title: "Total Items",
      value: totalItems,
      icon: Package,
      description: "Active inventory items",
    },
    {
      title: "Raw Materials",
      value: rawMaterials,
      icon: Boxes,
      description: "Ingredients & components",
    },
    {
      title: "Finished Products",
      value: finishedProducts,
      icon: TrendingUp,
      description: "Ready for distribution",
    },
    {
      title: "Low Stock Alerts",
      value: lowStock,
      icon: AlertTriangle,
      description: "Items need reordering",
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
                {/* Optional: Kept description, but smaller to fit new style */}
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ background: gradients[index], opacity: 0.1 }}
              >
                {/* Icons are h-6 w-6 to match OrderStats */}
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