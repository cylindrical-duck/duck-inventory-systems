import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Package, LogOut, Settings, TrendingUp, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ShippingStats from "@/components/ShippingStats";
import ShippingTable from "@/components/ShippingTable";
import AddShipmentDialog from "@/components/AddShipmentDialog";

export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderId?: string;
  orderNumber?: string;
  shipmentType: "order" | "shipment" | "restock" | "adjustment" | "sample" | "distributor_pickup" | "store_delivery";
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  scheduledDate: string;
  shippedDate?: string;
  trackingNumber?: string;
  carrier?: string;
  status: "scheduled" | "in_transit" | "delivered" | "cancelled";
  notes?: string;
  items?: Array<{ itemName: string; quantity: number }>;
}

const Shipping = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (companyId) {
      fetchShipments();
    }
  }, [companyId]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setCompanyId(data.company_id);
    } catch (error: any) {
      toast.error("Failed to fetch profile");
      console.error("Error fetching profile:", error);
    }
  };

  const fetchShipments = async () => {
    if (!companyId) return;

    try {
      const { data: shipmentsData, error } = await supabase
        .from("shipments")
        .select(`
          *,
          orders!shipments_order_id_fkey (
            order_number,
            order_items (
              item_name,
              quantity
            )
          )
        `)
        .eq("company_id", companyId)
        .order("scheduled_date", { ascending: false });

      if (error) throw error;

      const formattedShipments: Shipment[] = (shipmentsData || []).map((shipment) => ({
        id: shipment.id,
        shipmentNumber: shipment.shipment_number,
        orderId: shipment.order_id || undefined,
        orderNumber: shipment.orders?.order_number || undefined,
        shipmentType: shipment.shipment_type as Shipment["shipmentType"],
        recipientName: shipment.recipient_name,
        recipientEmail: shipment.recipient_email || undefined,
        recipientPhone: shipment.recipient_phone || undefined,
        shippingAddress: shipment.shipping_address || undefined,
        scheduledDate: shipment.scheduled_date,
        shippedDate: shipment.shipped_date || undefined,
        trackingNumber: shipment.tracking_number || undefined,
        carrier: shipment.carrier || undefined,
        status: shipment.status as Shipment["status"],
        notes: shipment.notes || undefined,
        items: shipment.orders?.order_items?.map((item: any) => ({
          itemName: item.item_name,
          quantity: item.quantity,
        })) || undefined,
      }));

      setShipments(formattedShipments);
    } catch (error: any) {
      toast.error("Failed to load shipments");
      console.error("Error fetching shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddShipment = async (shipment: Shipment) => {
    if (!companyId) {
      toast.error("Company information not loaded");
      return;
    }

    try {
      const { error } = await supabase
        .from("shipments")
        .insert({
          company_id: companyId,
          order_id: shipment.orderId || null,
          shipment_number: shipment.shipmentNumber,
          shipment_type: shipment.shipmentType,
          recipient_name: shipment.recipientName,
          recipient_email: shipment.recipientEmail || null,
          recipient_phone: shipment.recipientPhone || null,
          shipping_address: shipment.shippingAddress || null,
          scheduled_date: shipment.scheduledDate,
          tracking_number: shipment.trackingNumber || null,
          carrier: shipment.carrier || null,
          status: shipment.status,
          notes: shipment.notes || null,
        } as any);

      if (error) throw error;

      toast.success("Shipment created successfully");
      fetchShipments();
    } catch (error: any) {
      toast.error("Failed to create shipment");
      console.error("Error creating shipment:", error);
    }
  };

  const handleDeleteShipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("shipments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Shipment deleted successfully");
      fetchShipments();
    } catch (error: any) {
      toast.error("Failed to delete shipment");
      console.error("Error deleting shipment:", error);
    }
  };

  const handleUpdateStatus = async (id: string, status: Shipment["status"]) => {
    try {
      const updateData: any = { status };

      // If marking as in_transit and no shipped_date, set it
      if (status === "in_transit") {
        const shipment = shipments.find(s => s.id === id);
        if (!shipment?.shippedDate) {
          updateData.shipped_date = new Date().toISOString();

          // Create inventory transactions for the items
          if (shipment?.orderId) {
            await createInventoryTransactions(shipment.orderId, id);
          }
        }
      }

      const { error } = await supabase
        .from("shipments")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Shipment status updated");
      fetchShipments();
    } catch (error: any) {
      toast.error("Failed to update shipment status");
      console.error("Error updating status:", error);
    }
  };

  const createInventoryTransactions = async (orderId: string, shipmentId: string) => {
    try {
      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("item_name, quantity")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      // Get inventory items to match by name
      const { data: inventoryItems, error: invError } = await supabase
        .from("inventory_items")
        .select("id, name, quantity")
        .eq("company_id", companyId);

      if (invError) throw invError;

      // Create transactions and update inventory
      for (const orderItem of orderItems || []) {
        const inventoryItem = inventoryItems?.find(
          item => item.name.toLowerCase() === orderItem.item_name.toLowerCase()
        );

        if (inventoryItem) {
          // Create transaction log
          await supabase
            .from("inventory_transactions")
            .insert({
              company_id: companyId,
              inventory_item_id: inventoryItem.id,
              transaction_type: "shipment",
              quantity: -orderItem.quantity,
              reference_id: shipmentId,
              reference_type: "shipment",
              notes: `Shipped for order`,
            });

          // Update inventory quantity
          await supabase
            .from("inventory_items")
            .update({ quantity: inventoryItem.quantity - orderItem.quantity })
            .eq("id", inventoryItem.id);
        }
      }
    } catch (error) {
      console.error("Error creating inventory transactions:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Shipping Schedule
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage shipments and track deliveries
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Inventory
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/orders")}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Orders
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/shipping")}
              className="gap-2"
            >
              <Truck className="h-4 w-4" />
              Shipping
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/properties")}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Properties
            </Button>
            <AddShipmentDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              onAdd={handleAddShipment}
              companyId={companyId}
            />
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <ShippingStats shipments={shipments} />

        <ShippingTable
          shipments={shipments}
          onDelete={handleDeleteShipment}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </div>
  );
};

export default Shipping;
