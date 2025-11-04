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
import { Plus } from "lucide-react";
import { InventoryItem } from "./InventoryTable";
import { useCustomFields } from "@/hooks/useCustomFields";
import { supabase } from "@/integrations/supabase/client";

interface AddItemDialogProps {
  onAdd: (item: Omit<InventoryItem, "id" | "lastUpdated">, customData?: Record<string, any>) => void;
}

export const AddItemDialog = ({ onAdd }: AddItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "raw" as "raw" | "finished",
    quantity: "",
    unit: "",
    reorderLevel: "",
  });
  const [customData, setCustomData] = useState<Record<string, any>>({});
  
  const { fields } = useCustomFields(companyId, "inventory_items");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      category: formData.category,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      reorderLevel: Number(formData.reorderLevel),
    }, customData);
    setFormData({
      name: "",
      category: "raw",
      quantity: "",
      unit: "",
      reorderLevel: "",
    });
    setCustomData({});
    setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
          <DialogDescription>
            Add a new raw material or finished product to your inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., All-purpose flour"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: "raw" | "finished") =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw">Raw Material</SelectItem>
                <SelectItem value="finished">Finished Product</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="100"
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="kg, lbs, units"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorderLevel">Reorder Level</Label>
            <Input
              id="reorderLevel"
              type="number"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
              placeholder="20"
              required
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              You'll be alerted when stock falls below this level
            </p>
          </div>

          {/* Custom Fields */}
          {fields.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Custom Fields</h3>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
