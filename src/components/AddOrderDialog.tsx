import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { Order } from "@/pages/Orders";
import { useCustomFields } from "@/hooks/useCustomFields";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBranding } from "../context/BrandingContext";

interface AddOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (order: Order, customData?: Record<string, any>) => void;
}

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

// Define Customer Interface
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const AddOrderDialog = ({ open, onOpenChange, onAdd }: AddOrderDialogProps) => {
  const { primaryColor, accentColor } = useBranding();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [orderItems, setOrderItems] = useState<Array<{
    inventoryItemId: string;
    itemName: string;
    quantity: number;
    price: number;
    availableQty: number;
  }>>([]);
  const [needsShipping, setNeedsShipping] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    shippingAddress: "",
  });
  const [customData, setCustomData] = useState<Record<string, any>>({});

  const { fields } = useCustomFields(companyId, "orders");

  // Fetch company ID on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Fetch inventory and customers when the dialog opens and companyId is available
  useEffect(() => {
    if (companyId && open) {
      fetchFinishedProducts();
      fetchCustomers();
    }
  }, [companyId, open]);

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

  const fetchFinishedProducts = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, price, quantity, unit")
        .eq("company_id", companyId)
        .eq("category", "finished")
        .order("name");

      if (error) throw error;

      setInventoryItems(data?.map(item => ({
        id: item.id,
        name: item.name,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
        quantity: item.quantity,
        unit: item.unit,
      })) || []);
    } catch (error) {
      toast.error("Failed to load inventory items");
      console.error("Error fetching inventory:", error);
    }
  };

  // New function to fetch customers
  const fetchCustomers = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email, phone, address")
        .eq("company_id", companyId)
        .order("name");

      if (error) throw error;

      setCustomers(data || []);
    } catch (error) {
      toast.error("Failed to load customers");
      console.error("Error fetching customers:", error);
    }
  };

  // Function to handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find(c => c.id === customerId);

    if (customer) {
      // Auto-fill contact info
      setContactInfo({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      });

      if (customer.address) {
        setShippingInfo(prev => ({
          ...prev,
          shippingAddress: customer.address,
        }));
      }
    } else {
      setContactInfo({ name: "", email: "", phone: "" });
      setShippingInfo(prev => ({
        ...prev,
        shippingAddress: "",
      }));
    }
  };

  const resetForm = () => {
    setContactInfo({ name: "", email: "", phone: "" });
    setOrderItems([]);
    setNeedsShipping(false);
    setShippingInfo({ recipientName: "", recipientEmail: "", recipientPhone: "", shippingAddress: "" });
    setCustomData({});
    setSelectedCustomerId(null);
  };

  const handleOpenChangeWithReset = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetForm();
    }
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, {
      inventoryItemId: "",
      itemName: "",
      quantity: 0,
      price: 0,
      availableQty: 0,
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...orderItems];

    if (field === "inventoryItemId") {
      const selectedItem = inventoryItems.find(item => item.id === value);
      if (selectedItem) {
        newItems[index] = {
          inventoryItemId: value,
          itemName: selectedItem.name,
          quantity: 1,
          price: selectedItem.price,
          availableQty: selectedItem.quantity,
        };
      }
    } else if (field === "quantity") {
      const qty = Number(value);
      if (qty > newItems[index].availableQty) {
        toast.error(`Only ${newItems[index].availableQty} ${inventoryItems.find(i => i.id === newItems[index].inventoryItemId)?.unit || 'units'} available`);
        return;
      }
      newItems[index].quantity = qty;
    }

    setOrderItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactInfo.name || !contactInfo.email || !contactInfo.phone) {
      toast.error("Please ensure all customer contact details (Name, Email, Phone) are filled out.");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    if (orderItems.some(item => !item.inventoryItemId || item.quantity <= 0)) {
      toast.error("Please complete all order items");
      return;
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderNumber = `ORD-${Date.now()}`;

    if (needsShipping && !shippingInfo.shippingAddress) {
      toast.error("Please enter a shipping address");
      return;
    }

    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber,
      contactName: contactInfo.name,
      contactEmail: contactInfo.email,
      contactPhone: contactInfo.phone,
      selectedCustomerId: selectedCustomerId,
      items: orderItems.map(item => ({
        itemId: item.inventoryItemId,
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount,
      orderDate: new Date().toISOString(),
      status: "pending",
      needsShipping,
      shippingAddress: needsShipping ? shippingInfo.shippingAddress : undefined,
      recipientName: needsShipping ? (shippingInfo.recipientName || contactInfo.name) : undefined,
      recipientEmail: needsShipping ? (shippingInfo.recipientEmail || contactInfo.email) : undefined,
      recipientPhone: needsShipping ? (shippingInfo.recipientPhone || contactInfo.phone) : undefined,
    };

    onAdd(newOrder, customData);

    resetForm();
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
    <Dialog open={open} onOpenChange={handleOpenChangeWithReset}>
      <DialogTrigger asChild>
        <Button
          className="text-primary-foreground"
          style={{ backgroundColor: primaryColor }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Create a new customer order from finished products in inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Customer Information</h3>

            <div className="space-y-2">
              <Label htmlFor="customerSelect">Select Existing Customer</Label>
              <Select
                value={selectedCustomerId || "new"}
                onValueChange={handleCustomerSelect}
              >
                <SelectTrigger id="customerSelect">
                  <SelectValue placeholder="Select a customer or create a new one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">-- New Customer --</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Name *</Label>
                <Input
                  id="contactName"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone *</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Order Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                style={{ color: primaryColor, borderColor: primaryColor }}
              >
                <Plus className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
                Add Item
              </Button>
            </div>

            {orderItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-end p-3 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label>Product</Label>
                  <Select
                    value={item.inventoryItemId}
                    onValueChange={(value) => handleItemChange(index, "inventoryItemId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map((invItem) => (
                        <SelectItem key={invItem.id} value={invItem.id}>
                          {invItem.name} (${invItem.price.toFixed(2)} - {invItem.quantity} {invItem.unit} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    max={item.availableQty}
                    value={item.quantity || ""}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    placeholder="0"
                    disabled={!item.inventoryItemId}
                  />
                </div>
                <div className="w-28 space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="text"
                    value={`$${item.price.toFixed(2)}`}
                    disabled
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {orderItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items added yet. Click "Add Item" to get started.
              </p>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="needsShipping">Needs Shipping</Label>
                <p className="text-sm text-muted-foreground">
                  Create a shipment for this order
                </p>
              </div>
              <Switch
                id="needsShipping"
                checked={needsShipping}
                onCheckedChange={setNeedsShipping}
              />
            </div>

            {needsShipping && (
              <div className="space-y-4 pl-4 border-l-2">
                <h4 className="text-sm font-medium">Shipping Information</h4>
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Shipping Address *</Label>
                  <Input
                    id="shippingAddress"
                    value={shippingInfo.shippingAddress}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, shippingAddress: e.target.value })}
                    placeholder="123 Main St, City, State, ZIP"
                    required={needsShipping}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input
                      id="recipientName"
                      value={shippingInfo.recipientName}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, recipientName: e.target.value })}
                      placeholder="Leave empty to use customer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Recipient Email</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={shippingInfo.recipientEmail}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, recipientEmail: e.target.value })}
                      placeholder="Leave empty to use customer email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">Recipient Phone</Label>
                  <Input
                    id="recipientPhone"
                    type="tel"
                    value={shippingInfo.recipientPhone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, recipientPhone: e.target.value })}
                    placeholder="Leave empty to use customer phone"
                  />
                </div>
              </div>
            )}
          </div>

          {fields.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Additional Information</h3>
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

          {orderItems.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold">
                ${orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChangeWithReset(false)}>
              Cancel
            </Button>
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
              Create Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;