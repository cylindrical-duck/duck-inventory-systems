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
import { Package, LogOut, Settings, Truck, TrendingUp, UsersRound } from "lucide-react";
import { useBranding } from "../context/BrandingContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { primaryColor, accentColor, reloadBranding } = useBranding();

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

  const handleItemSubmit = async (itemData: Omit<InventoryItem, "id" | "lastUpdated">, customData?: Record<string, any>) => {
    if (!companyId) {
      toast.error("Company information not loaded");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const existingItem = items.find(
        (item) => item.name.toLowerCase() === itemData.name.toLowerCase()
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + itemData.quantity;

        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;

        await supabase.from("inventory_transactions").insert({
          company_id: companyId,
          inventory_item_id: existingItem.id,
          transaction_type: "restock",
          quantity: itemData.quantity,
          reference_type: "manual_restock",
          notes: "Manual stock addition",
        });

        toast.success(`Stock updated for ${existingItem.name}`);

      } else {
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
          .select()
          .single();

        if (insertError) throw insertError;
        if (!newItem) throw new Error("Failed to create item.");

        await supabase.from("inventory_transactions").insert({
          company_id: companyId,
          inventory_item_id: newItem.id,
          transaction_type: "restock",
          quantity: newItem.quantity,
          reference_type: "item_creation",
          notes: "New item created",
        });

        toast.success("New item added successfully");
      }

      fetchItems();
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
      <header className="border-b border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* ICON BOX WITH BRAND COLORS */}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background: `linear-gradient(to bottom right, var(--company-primary), var(--company-primary))`
                }}
              >
                <Package className="h-6 w-6 text-white" />
              </div>

              <div>
                {/* COMPANY TITLE WITH BRANDING GRADIENT */}
                <h1
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--company-primary), var(--company-accent), var(--company-primary))`
                  }}
                >
                  {companyName}
                </h1>

                <p className="text-muted-foreground mt-2">
                  CPG Inventory Management
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate("/dashboard")} className="gap-2">
                <Package className="h-4 w-4" style={{ color: primaryColor }} />
                Inventory
              </Button>

              <Button variant="outline" onClick={() => navigate("/orders")} className="gap-2">
                <TrendingUp className="h-4 w-4" style={{ color: primaryColor }} />
                Orders
              </Button>

              <Button variant="outline" onClick={() => navigate("/shipping")} className="gap-2">
                <Truck className="h-4 w-4" style={{ color: primaryColor }} />
                Shipping
              </Button>

              <Button variant="outline" onClick={() => navigate("/properties")} className="gap-2">
                <Settings className="h-4 w-4" style={{ color: primaryColor }} />
                Properties
              </Button>

              <AddItemDialog onAdd={handleItemSubmit} items={items} />

              <Button
                variant="outline"
                onClick={() => navigate("/teammanagement")}
                className="gap-2"
              >
                <UsersRound className="h-4 w-4" />
                Team Management
              </Button>

              <Button variant="ghost" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>


            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <InventoryStats
            totalItems={items.length}
            rawMaterials={rawMaterials.length}
            finishedProducts={finishedProducts.length}
            lowStock={lowStockItems.length}
          />

          <PendingOrdersCard companyId={companyId} />

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList
              className="bg-muted"
              style={{
                borderColor: "var(--company-primary)"
              }}
            >
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="raw">Raw Materials</TabsTrigger>
              <TabsTrigger value="finished">Finished Products</TabsTrigger>
              <TabsTrigger value="lowstock">Low Stock</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <InventoryTable items={items} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            </TabsContent>

            <TabsContent value="raw" className="space-y-4">
              <InventoryTable items={rawMaterials} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            </TabsContent>

            <TabsContent value="finished" className="space-y-4">
              <InventoryTable items={finishedProducts} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            </TabsContent>

            <TabsContent value="lowstock" className="space-y-4">
              <InventoryTable items={lowStockItems} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
