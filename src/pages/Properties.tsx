import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
// --- Import added icons ---
import { Trash2, Plus, Package, ShoppingCart, LogOut, Truck, Settings } from "lucide-react"; // <-- CHANGED
import { useNavigate } from "react-router-dom";

interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
  field_order: number;
}

const Properties = () => {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("DuckInventory"); // <-- ADDED
  const [inventoryFields, setInventoryFields] = useState<CustomField[]>([]);
  const [orderFields, setOrderFields] = useState<CustomField[]>([]);
  const [newField, setNewField] = useState({ name: "", type: "text" });
  const [activeTab, setActiveTab] = useState<"inventory" | "orders">("inventory");

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (companyId) {
      fetchCustomFields();
    }
  }, [companyId]);

  const fetchProfile = async () => {
    try {
      // 1. Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 2. Get company name from metadata
      if (user.user_metadata && user.user_metadata.company_name) { // <-- ADDED
        setCompanyName(user.user_metadata.company_name); // <-- ADDED
      }

      // 3. Get company ID from profiles table
      const { data: profileData, error: profileError } = await supabase // <-- CHANGED
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError; // <-- CHANGED
      setCompanyId(profileData.company_id); // <-- CHANGED
    } catch (error: any) {
      toast.error("Failed to fetch profile");
      console.error("Error fetching profile:", error);
    }
  };

  const fetchCustomFields = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from("custom_fields")
        .select("*")
        .eq("company_id", companyId)
        .order("field_order");

      if (error) throw error;

      const inventory = data?.filter(f => f.table_name === "inventory_items") || [];
      const orders = data?.filter(f => f.table_name === "orders") || [];

      setInventoryFields(inventory);
      setOrderFields(orders);
    } catch (error: any) {
      toast.error("Failed to load custom fields");
      console.error("Error fetching custom fields:", error);
    }
  };

  const handleAddField = async () => {
    if (!companyId) return;
    if (!newField.name.trim()) {
      toast.error("Field name is required");
      return;
    }

    const currentFields = activeTab === "inventory" ? inventoryFields : orderFields;
    if (currentFields.length >= 5) {
      toast.error("Maximum 5 custom fields allowed per table");
      return;
    }

    try {
      const { error } = await supabase
        .from("custom_fields")
        .insert({
          company_id: companyId,
          table_name: activeTab === "inventory" ? "inventory_items" : "orders",
          field_name: newField.name,
          field_type: newField.type,
          field_order: currentFields.length,
        });

      if (error) throw error;

      toast.success("Custom field added");
      setNewField({ name: "", type: "text" });
      fetchCustomFields();
    } catch (error: any) {
      toast.error("Failed to add custom field");
      console.error("Error adding custom field:", error);
    }
  };

  const handleDeleteField = async (id: string) => {
    try {
      const { error } = await supabase
        .from("custom_fields")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Custom field deleted");
      fetchCustomFields();
    } catch (error: any) {
      toast.error("Failed to delete custom field");
      console.error("Error deleting custom field:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const renderFieldsList = (fields: CustomField[]) => (
    <div className="space-y-3">
      {fields.map((field) => (
        <Card key={field.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{field.field_name}</p>
              <p className="text-sm text-muted-foreground capitalize">{field.field_type}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteField(field.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
      {fields.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No custom fields defined yet
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {companyName} Properties {/* <-- CHANGED */}
            </h1>
            <p className="text-muted-foreground mt-2">
              Customize your inventory and order fields
            </p>
          </div>
          {/* --- Standardized Header Buttons --- */}
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
              <ShoppingCart className="h-4 w-4" />
              Orders
            </Button>
            <Button // <-- ADDED
              variant="outline"
              onClick={() => navigate("/shipping")}
              className="gap-2"
            >
              <Truck className="h-4 w-4" />
              Shipping
            </Button>
            <Button // <-- ADDED
              variant="secondary"
              onClick={() => navigate("/properties")}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Properties
            </Button>
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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "inventory" | "orders")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="inventory">Inventory Fields</TabsTrigger>
            <TabsTrigger value="orders">Order Fields</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Custom Inventory Field</CardTitle>
                <CardDescription>
                  Create custom fields for your inventory items ({inventoryFields.length}/5)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-name">Field Name</Label>
                    <Input
                      id="field-name"
                      placeholder="e.g., Supplier"
                      value={newField.name}
                      onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field-type">Field Type</Label>
                    <Select
                      value={newField.type}
                      onValueChange={(value) => setNewField({ ...newField, type: value })}
                    >
                      <SelectTrigger id="field-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="boolean">Yes/No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddField}
                      disabled={inventoryFields.length >= 5}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Field
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {renderFieldsList(inventoryFields)}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Custom Order Field</CardTitle>
                <CardDescription>
                  Create custom fields for your orders ({orderFields.length}/5)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order-field-name">Field Name</Label>
                    <Input
                      id="order-field-name"
                      placeholder="e.g., Delivery Date"
                      value={newField.name}
                      onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order-field-type">Field Type</Label>
                    <Select
                      value={newField.type}
                      onValueChange={(value) => setNewField({ ...newField, type: value })}
                    >
                      <SelectTrigger id="order-field-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="boolean">Yes/No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddField}
                      disabled={orderFields.length >= 5}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Field
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {renderFieldsList(orderFields)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Properties;