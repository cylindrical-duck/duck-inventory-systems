import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, CheckCircle, Package } from "lucide-react";
import { Shipment } from "@/pages/Shipping";

interface ShippingStatsProps {
  shipments: Shipment[];
}

const ShippingStats = ({ shipments }: ShippingStatsProps) => {
  const scheduled = shipments.filter(s => s.status === "scheduled").length;
  const inTransit = shipments.filter(s => s.status === "in_transit").length;
  const delivered = shipments.filter(s => s.status === "delivered").length;
  const total = shipments.length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{scheduled}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          <Truck className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inTransit}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{delivered}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingStats;
