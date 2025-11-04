import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InventoryStats } from "@/components/InventoryStats";
import { InventoryTable, InventoryItem } from "@/components/InventoryTable";
import { AddItemDialog } from "@/components/AddItemDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Package, ShoppingCart, LogOut } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

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
        lastUpdated: new Date(item.updated_at).toLocaleDateString(),
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

  const handleAddItem = async (newItem: Omit<InventoryItem, "id" | "lastUpdated">) => {
    if (!companyId) {
      toast.error("Company information not loaded");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("inventory_items").insert({
        user_id: user.id,
        company_id: companyId,
        name: newItem.name,
        category: newItem.category,
        quantity: newItem.quantity,
        unit: newItem.unit,
        reorder_level: newItem.reorderLevel,
      } as any);

      if (error) throw error;

      toast.success("Item added successfully");
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to add item");
      console.error("Error adding item:", error);
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
                <h1 className="text-2xl font-bold text-foreground">DuckInventory</h1>
                <p className="text-sm text-muted-foreground">CPG Inventory Management</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/orders")}
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Orders
              </Button>
              <AddItemDialog onAdd={handleAddItem} />
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
