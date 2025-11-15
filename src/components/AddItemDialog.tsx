import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Plus, Check, ChevronsUpDown } from "lucide-react";
// Import InventoryItem from its definition. Assuming it's in a shared types file or Dashboard
// If not, you might need to adjust this import path or redeclare the interface.
import { InventoryItem } from "./InventoryTable"; // Adjust this path if needed
import { useCustomFields } from "@/hooks/useCustomFields";
import { supabase } from "@/integrations/supabase/client";

// --- Define initial state for the form ---
const initialFormData = {
  category: "raw" as "raw" | "finished",
  quantity: "",
  unit: "",
  reorderLevel: "",
  price: "",
};

// --- Update Props to accept the items list ---
interface AddItemDialogProps {
  onAdd: (item: Omit<InventoryItem, "id" | "lastUpdated">, customData?: Record<string, any>) => void;
  items: InventoryItem[]; // <-- ADDED
}

export const AddItemDialog = ({ onAdd, items }: AddItemDialogProps) => { // <-- ADDED items
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // --- State for the form, combobox, and logic ---
  const [formData, setFormData] = useState(initialFormData);
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [isExistingItem, setIsExistingItem] = useState(false);

  const { fields } = useCustomFields(companyId, "inventory_items");

  useEffect(() => {
    fetchProfile();
  }, []);

  // --- Helper to reset all state on close/submit ---
  const resetForm = () => {
    setFormData(initialFormData);
    setCustomData({});
    setSelectedName("");
    setIsExistingItem(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

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

  // --- This is the new core logic for the combobox ---
  const handleNameSelect = (name: string) => {
    setSelectedName(name);

    const existingItem = items.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (existingItem) {
      // Item EXISTS: Lock form and fill data
      setFormData({
        category: existingItem.category,
        quantity: "", // Clear quantity for user to add new stock
        unit: existingItem.unit,
        reorderLevel: String(existingItem.reorderLevel),
        price: String(existingItem.price),
      });
      setIsExistingItem(true);
      // Note: We don't load customData for existing items yet,
      // as we are just adding stock.
    } else {
      // Item is NEW: Reset form to defaults
      setFormData(initialFormData);
      setIsExistingItem(false);
    }
    setComboboxOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: selectedName, // <-- Use selectedName
      category: formData.category,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      reorderLevel: Number(formData.reorderLevel),
      price: Number(formData.price),
    }, customData);

    resetForm();
    setOpen(false);
  };

  // Inside your AddItemDialog component, paste this full function definition:

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
        return null; // <-- Make sure it returns null by default
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}> {/* <-- Use new handler */}
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* --- Dynamic Title --- */}
          <DialogTitle>
            {isExistingItem ? "Add Stock to Existing Item" : "Add New Inventory Item"}
          </DialogTitle>
          <DialogDescription>
            {isExistingItem
              ? `Add new stock for "${selectedName}". Only quantity is editable.`
              : "Add a new raw material or finished product to your inventory."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            {/* --- REPLACED INPUT WITH COMBOBOX --- */}
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedName || "Select item or type new..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search item or type new..."
                    onValueChange={(search) => setSelectedName(search)} // <-- Update name as user types
                  />
                  <CommandEmpty>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleNameSelect(selectedName);
                      }}
                    >
                      Create new item: "{selectedName}"
                    </Button>
                  </CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {items.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.name}
                          onSelect={(currentValue) => {
                            handleNameSelect(currentValue);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${selectedName.toLowerCase() === item.name.toLowerCase()
                              ? "opacity-100"
                              : "opacity-0"
                              }`}
                          />
                          {item.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: "raw" | "finished") =>
                setFormData({ ...formData, category: value })
              }
              disabled={isExistingItem} // <-- ADDED
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
              <Label htmlFor="quantity">
                {isExistingItem ? "Quantity to Add" : "Quantity"} {/* <-- Dynamic Label */}
              </Label>
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
                disabled={isExistingItem} // <-- ADDED
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
              disabled={isExistingItem} // <-- ADDED
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per Unit</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              required
              min="0"
              disabled={isExistingItem} // <-- ADDED
            />
          </div>

          {/* Custom Fields - only show for NEW items */}
          {!isExistingItem && fields.length > 0 && (
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
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!selectedName || !formData.quantity} // <-- Disable if no name or qty
            >
              {/* --- Dynamic Button Text --- */}
              {isExistingItem ? "Add Stock" : "Add New Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};