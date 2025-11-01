import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import OrderStats from "@/components/OrderStats";
import OrderTable from "@/components/OrderTable";
import AddOrderDialog from "@/components/AddOrderDialog";
import { useNavigate } from "react-router-dom";

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  items: OrderItem[];
  totalAmount: number;
  orderDate: string;
  status: "pending" | "processing" | "completed" | "cancelled";
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "1",
      orderNumber: "ORD-001",
      contactName: "Sweet Treats Bakery",
      contactEmail: "orders@sweettreats.com",
      contactPhone: "(555) 123-4567",
      items: [
        { itemId: "1", itemName: "Chocolate Chip Cookies", quantity: 100, price: 2.5 },
        { itemId: "2", itemName: "Sea Salt Caramel Cookies", quantity: 50, price: 3.0 },
      ],
      totalAmount: 400,
      orderDate: new Date().toISOString(),
      status: "completed",
    },
    {
      id: "2",
      orderNumber: "ORD-002",
      contactName: "Gourmet Foods Co",
      contactEmail: "purchasing@gourmetfoods.com",
      contactPhone: "(555) 987-6543",
      items: [
        { itemId: "3", itemName: "Extra Virgin Olive Oil", quantity: 200, price: 15.0 },
      ],
      totalAmount: 3000,
      orderDate: new Date(Date.now() - 86400000).toISOString(),
      status: "processing",
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddOrder = (order: Order) => {
    setOrders([order, ...orders]);
  };

  const handleDeleteOrder = (id: string) => {
    setOrders(orders.filter((order) => order.id !== id));
  };

  const handleUpdateStatus = (id: string, status: Order["status"]) => {
    setOrders(
      orders.map((order) =>
        order.id === id ? { ...order, status } : order
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Order Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Track and manage your customer orders
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Inventory
            </Button>
            <AddOrderDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              onAdd={handleAddOrder}
            />
          </div>
        </div>

        <OrderStats orders={orders} />

        <OrderTable
          orders={orders}
          onDelete={handleDeleteOrder}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </div>
  );
};

export default Orders;
