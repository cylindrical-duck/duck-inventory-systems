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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import { InventoryItem } from "./InventoryTable";
import { useCustomFields } from "@/hooks/useCustomFields";
import { supabase } from "@/integrations/supabase/client";
import { useBranding } from "../context/BrandingContext";
import { toast } from "sonner";

// --- Define initial state for the form ---
const initialFormData = {
  category: "raw" as "raw" | "finished",
  quantity: "",
  unit: "",
  reorderLevel: "",
  price: "",
};

const actionOptions = [
  { value: "add_new", label: "Add New Item" },
  { value: "restock", label: "Add to Existing Stock" },
  { value: "returns", label: "Process Return (Add Stock)" },
  { value: "damaged_goods", label: "Log Damaged Goods (Remove Stock)" },
  { value: "sample", label: "Log Sample Used (Remove Stock)" },
  { value: "correction", label: "Make Correction (Remove Stock)" },
];

interface AddItemDialogProps {
  onAdd: (
    item: Omit<InventoryItem, "id" | "lastUpdated">,
    customData: Record<string, any> | undefined,
    actionType: string,
    notes: string
  ) => void;
  items: InventoryItem[];
}

export const AddItemDialog = ({ onAdd, items }: AddItemDialogProps) => {
  const { primaryColor, accentColor } = useBranding();
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // --- New/Updated State ---
  const [actionType, setActionType] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [notes, setNotes] = useState("");

  const { fields } = useCustomFields(companyId, "inventory_items");

  useEffect(() => {
    fetchProfile();
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setCustomData({});
    setSelectedName("");
    setActionType("");
    setNotes("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const fetchProfile = async () => {
    // ... (This function is unchanged)
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

  // --- UPDATED handleExistingItemSelect (Handles selection from the combobox) ---
  const handleExistingItemSelect = (name: string) => {
    const existingItem = items.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (!existingItem) {
      toast.error("Item not found. You must select an existing item.");
      return;
    }

    setSelectedName(name);
    // Pre-fill form with existing data, but clear quantity
    setFormData({
      category: existingItem.category,
      quantity: "", // Clear quantity for user to input the *change*
      unit: existingItem.unit,
      reorderLevel: String(existingItem.reorderLevel),
      price: String(existingItem.price),
    });
    setComboboxOpen(false);
  };

  // --- UPDATED handleSubmit ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if the item name is valid (especially for 'Add New')
    if (isAddNew) {
      const existingItem = items.find(
        (item) => item.name.toLowerCase() === selectedName.toLowerCase()
      );
      if (existingItem) {
        toast.error("Item already exists. Use 'Add to Existing' action.");
        return;
      }
    } else if (!items.find(item => item.name.toLowerCase() === selectedName.toLowerCase())) {
      // Check if a selected item is actually in the list for adjustments
      if (selectedName === "" || !items.map(item => item.name.toLowerCase()).includes(selectedName.toLowerCase())) {
        toast.error("Please select an existing item for this action.");
        return;
      }
    }


    onAdd(
      {
        name: selectedName,
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        reorderLevel: Number(formData.reorderLevel),
        price: Number(formData.price),
      },
      customData,
      actionType,
      notes
    );

    resetForm();
    setOpen(false);
  };

  const renderCustomField = (field: any) => {
    // ... (This function is unchanged)
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

  // --- Helper variables for conditional rendering ---
  const isAddNew = actionType === "add_new";
  const isAdjustment = actionType !== "" && !isAddNew;

  // --- Helper function for dynamic labels ---
  const getDialogTitle = () => {
    if (!actionType) return "Select Action";
    return actionOptions.find(opt => opt.value === actionType)?.label || "Manage Inventory";
  };

  const getQuantityLabel = () => {
    if (isAddNew) return "Initial Quantity";
    if (["restock", "returns"].includes(actionType)) return "Quantity to Add";
    if (["damaged_goods", "sample", "correction"].includes(actionType)) return "Quantity to Remove";
    return "Quantity";
  };

  const getSubmitButtonText = () => {
    if (isAddNew) return "Add New Item";
    if (["restock", "returns"].includes(actionType)) return "Add Stock";
    if (["damaged_goods", "sample", "correction"].includes(actionType)) return "Remove Stock";
    return "Submit";
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          style={{ backgroundColor: primaryColor }}
          className="text-primary-foreground"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {isAddNew
              ? "Add a new raw material or finished product to your inventory."
              : "Select an item to adjust its stock level."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* --- 1. NEW Action Dropdown --- */}
          <div className="space-y-2">
            <Label htmlFor="actionType">Action</Label>
            <Select
              value={actionType}
              onValueChange={(value) => {
                setActionType(value);
                setSelectedName("");
                setFormData(initialFormData);
                setNotes("");
              }}
            >
              <SelectTrigger id="actionType">
                <SelectValue placeholder="Select an action..." />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* --- Only show the rest of the form if an action is selected --- */}
          {actionType && (
            <>
              {/* --- 2. CONDITIONAL Item Name Input/Combobox --- */}
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>

                {isAddNew ? (
                  // --- SIMPLE INPUT FOR NEW ITEM ---
                  <Input
                    id="name"
                    value={selectedName}
                    onChange={(e) => setSelectedName(e.target.value)}
                    placeholder="Type a unique new item name..."
                    required
                  />
                ) : (
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full justify-between font-normal"
                      >
                        {selectedName || "Select an existing item..."}
                        <ChevronsUpDown
                          className="ml-2 h-4 w-4 shrink-0 opacity-50"
                          style={{ color: primaryColor }}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search item..."
                        // This input changes the filter/search term, not the selectedName immediately
                        />
                        <CommandEmpty>
                          <span className="p-4 text-sm text-muted-foreground">No item found.</span>
                        </CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {items.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.name}
                                onSelect={(currentValue) => {
                                  handleExistingItemSelect(currentValue);
                                }}
                              >
                                <Check
                                  style={{ color: primaryColor }}
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
                )}
              </div>

              {/* --- 3. UPDATED Quantity (Always show, but label changes) --- */}
              <div className="space-y-2">
                <Label htmlFor="quantity">{getQuantityLabel()}</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="ex. 100"
                  required
                  min="0"
                />
              </div>

              {/* --- 4. NEW Notes field (for adjustments only) --- */}
              {isAdjustment && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., 'Box dropped during receiving' or 'Client return, order #123'"
                  />
                </div>
              )}

              {isAddNew && (
                <>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reorderLevel">Reorder Level</Label>
                      <Input
                        id="reorderLevel"
                        type="number"
                        value={formData.reorderLevel}
                        onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                        placeholder="ex. 20"
                        required
                        min="0"
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
                        placeholder="ex. 0.00"
                        required
                        min="0"
                      />
                    </div>
                  </div>

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
                </>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="text-primary-foreground"
              disabled={!actionType || !selectedName || !formData.quantity}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = accentColor;
                }
              }}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
            >
              {getSubmitButtonText()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};