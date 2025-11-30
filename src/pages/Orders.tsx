import { useState, useEffect } from "react";
import OrderStats from "@/components/OrderStats";
import OrderTable from "@/components/OrderTable";
import AddOrderDialog from "@/components/AddOrderDialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";

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
  selectedCustomerId: string;
  items: OrderItem[];
  totalAmount: number;
  orderDate: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  needsShipping?: boolean;
  shippingAddress?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

const Orders = () => {
  const navigate = useNavigate(); // Still needed for handleAddOrder logic
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (companyId) {
      fetchOrders();
    }
  }, [companyId]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (user.user_metadata && user.user_metadata.company_name) {
        setCompanyName(user.user_metadata.company_name);
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setCompanyId(profileData.company_id);
    } catch (error: any) {
      toast.error("Failed to fetch profile");
      console.error("Error fetching profile:", error);
    }
  };

  const fetchOrders = async () => {
    if (!companyId) return;

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const formattedOrders: Order[] = (ordersData || []).map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        contactName: order.customer_name,
        contactEmail: order.customer_email,
        contactPhone: order.customer_phone,
        selectedCustomerId: order.customer_id,
        items: (order.order_items || []).map((item: any) => ({
          itemId: item.id,
          itemName: item.item_name,
          quantity: item.quantity,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        })),
        totalAmount: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount,
        orderDate: order.created_at,
        status: order.status as Order["status"],
        needsShipping: order.needs_shipping,
        shippingAddress: order.shipping_address,
        recipientName: order.recipient_name,
        recipientEmail: order.recipient_email,
        recipientPhone: order.recipient_phone,
      }));

      setOrders(formattedOrders);
    } catch (error: any) {
      toast.error("Failed to load orders");
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = async (order: Order, customData?: Record<string, any>) => {
    if (!companyId) {
      toast.error("Company information not loaded");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the order
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          company_id: companyId,
          order_number: order.orderNumber,
          customer_name: order.contactName,
          customer_email: order.contactEmail,
          customer_phone: order.contactPhone,
          customer_id: order.selectedCustomerId || null,
          total_amount: order.totalAmount,
          status: order.status,
          custom_data: customData || {},
          needs_shipping: order.needsShipping || false,
          shipping_address: order.shippingAddress,
          recipient_name: order.recipientName,
          recipient_email: order.recipientEmail,
          recipient_phone: order.recipientPhone,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = order.items.map((item) => ({
        order_id: newOrder.id,
        item_name: item.itemName,
        quantity: item.quantity,
        price: item.price,
        inventory_item_id: item.itemId,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      for (const item of order.items) {
        const { data: currentItem, error: fetchError } = await supabase
          .from("inventory_items")
          .select("quantity")
          .eq("id", item.itemId)
          .single();

        if (fetchError) throw fetchError;

        const newQuantity = currentItem.quantity - item.quantity;

        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ quantity: newQuantity })
          .eq("id", item.itemId);

        if (updateError) throw updateError;

        // Create inventory transaction record
        await supabase
          .from("inventory_transactions")
          .insert({
            company_id: companyId,
            inventory_item_id: item.itemId,
            transaction_type: "order",
            quantity: -item.quantity,
            reference_id: newOrder.id,
            reference_type: "order",
            notes: `Order ${order.orderNumber} - ${order.contactName}`,
          });
      }
      if (order.needsShipping) {
        const shipmentNumber = `SHP-${Date.now()}`;
        const { error: shipmentError } = await supabase
          .from("shipments")
          .insert({
            company_id: companyId,
            order_id: newOrder.id,
            shipment_number: shipmentNumber,
            shipment_type: "shipment",
            recipient_name: order.recipientName || order.contactName,
            recipient_email: order.recipientEmail || order.contactEmail,
            recipient_phone: order.recipientPhone || order.contactPhone,
            shipping_address: order.shippingAddress,
            scheduled_date: new Date().toISOString(),
            status: "scheduled",
          });

        if (shipmentError) throw shipmentError;
      }

      toast.success(order.needsShipping ? "Order created, inventory updated, and shipment scheduled" : "Order created and inventory updated");
      fetchOrders();
    } catch (error: any) {
      toast.error("Failed to create order");
      console.error("Error creating order:", error);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (error: any) {
      toast.error("Failed to delete order");
      console.error("Error deleting order:", error);
    }
  };

  const handleUpdateStatus = async (id: string, status: Order["status"]) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast.success("Order status updated");
      fetchOrders();
    } catch (error: any) {
      toast.error("Failed to update order status");
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AppHeader
        companyName={companyName}
        pageTitle="Orders"
        pageSubtitle="Track and manage your customer orders"
        activePage="orders"
      >
        <AddOrderDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAdd={handleAddOrder}
        />
      </AppHeader>

      <div className="container mx-auto p-6 space-y-8">

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