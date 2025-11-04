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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderItem } from "@/pages/Orders";
import { useCustomFields } from "@/hooks/useCustomFields";
import { supabase } from "@/integrations/supabase/client";

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (order: Order, customData?: Record<string, any>) => void;
}

const AddOrderDialog = ({ open, onOpenChange, onAdd }: AddOrderDialogProps) => {
  const { toast } = useToast();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [items, setItems] = useState<OrderItem[]>([
    { itemId: "", itemName: "", quantity: 0, price: 0 },
  ]);

  const { fields } = useCustomFields(companyId, "orders");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (data) setCompanyId(data.company_id);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { itemId: "", itemName: "", quantity: 0, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactName || !contactEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in contact name and email.",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter(
      (item) => item.itemName && item.quantity > 0 && item.price > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the order.",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = validItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: `ORD-${String(Date.now()).slice(-6)}`,
      contactName,
      contactEmail,
      contactPhone,
      items: validItems.map((item) => ({
        ...item,
        itemId: Date.now().toString() + Math.random(),
      })),
      totalAmount,
      orderDate: new Date().toISOString(),
      status: "pending",
    };

    onAdd(newOrder, customData);
    toast({
      title: "Order Created",
      description: `Order ${newOrder.orderNumber} has been created successfully.`,
    });

    // Reset form
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setCustomData({});
    setItems([{ itemId: "", itemName: "", quantity: 0, price: 0 }]);
    onOpenChange(false);
  };

  const renderCustomField = (field: any) => {
    const value = customData[field.field_name] || "";
    
    switch (field.field_type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => setCustomData({ ...customData, [field.field_name]: e.target.value })}
            placeholder={`Enter ${field.field_name}`}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setCustomData({ ...customData, [field.field_name]: e.target.value })}
            placeholder={`Enter ${field.field_name}`}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setCustomData({ ...customData, [field.field_name]: e.target.value })}
          />
        );
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true || value === "true"}
              onCheckedChange={(checked) => setCustomData({ ...customData, [field.field_name]: checked })}
            />
            <span className="text-sm">Yes</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Company or Person Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Order Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 p-4 bg-muted/50 rounded-lg"
              >
                <div className="col-span-5 space-y-2">
                  <Label htmlFor={`itemName-${index}`}>Item Name</Label>
                  <Input
                    id={`itemName-${index}`}
                    value={item.itemName}
                    onChange={(e) =>
                      handleItemChange(index, "itemName", e.target.value)
                    }
                    placeholder="Product name"
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", Number(e.target.value))
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor={`price-${index}`}>Price</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    step="0.01"
                    value={item.price || ""}
                    onChange={(e) =>
                      handleItemChange(index, "price", Number(e.target.value))
                    }
                    placeholder="0.00"
                    min="0"
                  />
                </div>
                {items.length > 1 && (
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Custom Fields */}
          {fields.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Custom Fields</h3>
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.field_name} className="capitalize">
                    {field.field_name}
                  </Label>
                  {renderCustomField(field)}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-lg font-semibold">
              Total: $
              {items
                .reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0)
                .toFixed(2)}
            </div>
            <Button
              type="submit"
              className="bg-gradient-to-r from-primary to-accent"
            >
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
