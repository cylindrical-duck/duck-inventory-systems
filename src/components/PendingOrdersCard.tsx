import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PendingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
}

interface PendingOrdersCardProps {
  companyId: string | null;
}

const PendingOrdersCard = ({ companyId }: PendingOrdersCardProps) => {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [pendingShipments, setPendingShipments] = useState(0);

  useEffect(() => {
    if (companyId) {
      fetchPendingData();
    }
  }, [companyId]);

  const fetchPendingData = async () => {
    if (!companyId) return;

    try {
      // Fetch orders that haven't been shipped
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, total_amount, status")
        .eq("company_id", companyId)
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      setPendingOrders(
        (ordersData || []).map((order) => ({
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          totalAmount: typeof order.total_amount === "string" 
            ? parseFloat(order.total_amount) 
            : order.total_amount,
          status: order.status,
        }))
      );

      // Fetch scheduled shipments
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from("shipments")
        .select("id")
        .eq("company_id", companyId)
        .eq("status", "scheduled");

      if (shipmentsError) throw shipmentsError;

      setPendingShipments((shipmentsData || []).length);
    } catch (error) {
      console.error("Error fetching pending data:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Pending Orders & Shipments</CardTitle>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Orders to Ship</p>
              <p className="text-2xl font-bold">{pendingOrders.length}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/orders")}
              className="gap-2"
            >
              View Orders
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Scheduled Shipments</p>
              <p className="text-2xl font-bold">{pendingShipments}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/shipping")}
              className="gap-2"
            >
              View Schedule
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {pendingOrders.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">Recent Pending Orders</p>
              <div className="space-y-2">
                {pendingOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded cursor-pointer"
                    onClick={() => navigate("/orders")}
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    </div>
                    <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingOrdersCard;
