import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Boxes, AlertTriangle, TrendingUp } from "lucide-react";

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
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Items
          </CardTitle>
          <Package className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{totalItems}</div>
          <p className="text-xs text-muted-foreground">Active inventory items</p>
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Raw Materials
          </CardTitle>
          <Boxes className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{rawMaterials}</div>
          <p className="text-xs text-muted-foreground">Ingredients & components</p>
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Finished Products
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{finishedProducts}</div>
          <p className="text-xs text-muted-foreground">Ready for distribution</p>
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Low Stock Alerts
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{lowStock}</div>
          <p className="text-xs text-muted-foreground">Items need reordering</p>
        </CardContent>
      </Card>
    </div>
  );
};
