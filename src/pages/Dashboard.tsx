import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InventoryStats } from "@/components/InventoryStats";
import { InventoryTable, InventoryItem } from "@/components/InventoryTable";
import { AddItemDialog } from "@/components/AddItemDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingOrdersCard from "@/components/PendingOrdersCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Package, ShoppingCart, LogOut, Settings, Truck, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("DuckInventory");

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (companyId) {
      fetchItems();
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
  }


  const fetchItems = async () => {
    if (!companyId) return;
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const formattedItems: InventoryItem[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category as "raw" | "finished",
        quantity: item.quantity,
        unit: item.unit,
        reorderLevel: item.reorder_level,
        lastUpdated: item.updated_at,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
      }));
      setItems(formattedItems);
    } catch (error: any) {
      toast.error("Failed to load inventory items");
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  // --- THIS IS THE NEW "CREATE OR UPDATE" LOGIC ---
  const handleItemSubmit = async (itemData: Omit<InventoryItem, "id" | "lastUpdated">, customData?: Record<string, any>) => {
    if (!companyId) {
      toast.error("Company information not loaded");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Check if item already exists (case-insensitive)
      const existingItem = items.find(
        (item) => item.name.toLowerCase() === itemData.name.toLowerCase()
      );

      if (existingItem) {
        // --- UPDATE LOGIC ---
        const newQuantity = existingItem.quantity + itemData.quantity;

        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;

        // Log transaction for the restock
        await supabase.from("inventory_transactions").insert({
          company_id: companyId,
          inventory_item_id: existingItem.id,
          transaction_type: "restock",
          quantity: itemData.quantity, // Log only the added amount
          reference_type: "manual_restock",
          notes: "Manual stock addition",
        });

        toast.success(`Stock updated for ${existingItem.name}`);

      } else {
        // --- CREATE LOGIC (Original Behavior) ---
        const { data: newItem, error: insertError } = await supabase
          .from("inventory_items")
          .insert({
            user_id: user.id,
            company_id: companyId,
            name: itemData.name,
            category: itemData.category,
            quantity: itemData.quantity,
            unit: itemData.unit,
            reorder_level: itemData.reorderLevel,
            price: itemData.price,
            custom_data: customData || {},
          } as any)
          .select() // <-- Added .select()
          .single(); // <-- Added .single()

        if (insertError) throw insertError;
        if (!newItem) throw new Error("Failed to create item.");

        // Log transaction for the initial stock
        await supabase.from("inventory_transactions").insert({
          company_id: companyId,
          inventory_item_id: newItem.id,
          transaction_type: "restock", // <-- CHANGED
          quantity: newItem.quantity,
          reference_type: "item_creation",
          notes: "New item created", // This note clarifies it's an initial stock
        });

        toast.success("New item added successfully");
      }

      fetchItems(); // Refresh the table
    } catch (error: any) {
      toast.error("Failed to submit item");
      console.error("Error submitting item:", error);
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    toast.info("Edit functionality coming soon!");
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to delete item");
      console.error("Error deleting item:", error);
    }
  };

  const rawMaterials = items.filter((item) => item.category === "raw");
  const finishedProducts = items.filter((item) => item.category === "finished");
  const lowStockItems = items.filter((item) => item.quantity <= item.reorderLevel);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  {companyName}
                </h1>
                <p className="text-muted-foreground mt-2">
                  CPG Inventory Management
                </p>
              </div>
            </div>
            {/* --- HEADER BUTTONS FIXED --- */}
            <div className="flex gap-3">
              <Button
                variant="default" // <-- CHANGED: Set to default (or secondary) for active page
                onClick={() => navigate("/dashboard")} // <-- CHANGED: Corrected route
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
                variant="outline"
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
              {/* --- PASSING ITEMS TO DIALOG --- */}
              <AddItemDialog
                onAdd={handleItemSubmit} // <-- CHANGED: Using new handler
                items={items} // <-- ADDED: Pass the items list
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats */}
          <InventoryStats
            totalItems={items.length}
            rawMaterials={rawMaterials.length}
            finishedProducts={finishedProducts.length}
            lowStock={lowStockItems.length}
          />

          {/* Pending Orders & Shipments */}
          <PendingOrdersCard companyId={companyId} />

          {/* Inventory Table with Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="bg-muted">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="raw">Raw Materials</TabsTrigger>
              <TabsTrigger value="finished">Finished Products</TabsTrigger>
              <TabsTrigger value="lowstock">Low Stock</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <InventoryTable
                items={items}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            </TabsContent>

            <TabsContent value="raw" className="space-y-4">
              <InventoryTable
                items={rawMaterials}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            </TabsContent>

            <TabsContent value="finished" className="space-y-4">
              <InventoryTable
                items={finishedProducts}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            </TabsContent>

            <TabsContent value="lowstock" className="space-y-4">
              <InventoryTable
                items={lowStockItems}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;