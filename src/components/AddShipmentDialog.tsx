import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { Shipment } from "@/pages/Shipping";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "../context/BrandingContext"; // <-- 1. IMPORT HOOK

interface AddShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (shipment: Shipment) => void;
  companyId: string | null;
}

const AddShipmentDialog = ({ open, onOpenChange, onAdd, companyId }: AddShipmentDialogProps) => {
  // --- 2. GET BRANDING COLORS ---
  const { primaryColor, accentColor } = useBranding();
  const [orders, setOrders] = useState<Array<{ id: string; orderNumber: string; customerName: string }>>([]);
  const [formData, setFormData] = useState<Partial<Shipment>>({
    status: "scheduled",
    shipmentType: "shipment",
  });

  useEffect(() => {
    if (open && companyId) {
      fetchOrders();
    }
  }, [open, companyId]);

  const fetchOrders = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name")
        .eq("company_id", companyId)
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(
        (data || []).map((order) => ({
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
        }))
      );
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setFormData({
        ...formData,
        orderId,
        orderNumber: order.orderNumber,
        recipientName: order.customerName,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const shipmentNumber = formData.shipmentNumber || `SHP-${Date.now()}`;

    onAdd({
      id: "",
      shipmentNumber,
      orderId: formData.orderId,
      orderNumber: formData.orderNumber,
      shipmentType: formData.shipmentType as Shipment["shipmentType"],
      recipientName: formData.recipientName || "",
      recipientEmail: formData.recipientEmail,
      recipientPhone: formData.recipientPhone,
      shippingAddress: formData.shippingAddress,
      scheduledDate: formData.scheduledDate || new Date().toISOString(),
      trackingNumber: formData.trackingNumber,
      carrier: formData.carrier,
      status: formData.status as Shipment["status"],
      notes: formData.notes,
    });

    setFormData({ status: "scheduled", shipmentType: "shipment" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {/* --- 3. APPLY DYNAMIC STYLING --- */}
        <Button
          className="gap-2 text-primary-foreground"
          style={{ backgroundColor: primaryColor }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
        >
          <Plus className="h-4 w-4" />
          New Shipment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Shipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipmentType">Shipment Type</Label>
              <Select
                value={formData.shipmentType}
                onValueChange={(value) =>
                  setFormData({ ...formData, shipmentType: value as Shipment["shipmentType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="shipment">Shipment</SelectItem>
                  <SelectItem value="sample">Sample</SelectItem>
                  <SelectItem value="distributor_pickup">Distributor Pickup</SelectItem>
                  <SelectItem value="store_delivery">Store Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderId">Link to Order (Optional)</Label>
              <Select value={formData.orderId} onValueChange={handleOrderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order..." />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name *</Label>
            <Input
              id="recipientName"
              value={formData.recipientName || ""}
              onChange={(e) =>
                setFormData({ ...formData, recipientName: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={formData.recipientEmail || ""}
                onChange={(e) =>
                  setFormData({ ...formData, recipientEmail: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientPhone">Recipient Phone</Label>
              <Input
                id="recipientPhone"
                value={formData.recipientPhone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, recipientPhone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingAddress">Shipping Address</Label>
            <Textarea
              id="shippingAddress"
              value={formData.shippingAddress || ""}
              onChange={(e) =>
                setFormData({ ...formData, shippingAddress: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date *</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={
                  formData.scheduledDate
                    ? new Date(formData.scheduledDate).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDate: new Date(e.target.value).toISOString() })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier</Label>
              <Input
                id="carrier"
                value={formData.carrier || ""}
                onChange={(e) =>
                  setFormData({ ...formData, carrier: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input
              id="trackingNumber"
              value={formData.trackingNumber || ""}
              onChange={(e) =>
                setFormData({ ...formData, trackingNumber: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {/* --- 3. APPLY DYNAMIC STYLING --- */}
            <Button
              type="submit"
              className="text-primary-foreground"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = accentColor;
                }
              }}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
            >
              Create Shipment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddShipmentDialog;