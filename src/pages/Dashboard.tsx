import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InventoryStats } from "@/components/InventoryStats";
import { InventoryTable, InventoryItem } from "@/components/InventoryTable";
import { AddItemDialog } from "@/components/AddItemDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingOrdersCard from "@/components/PendingOrdersCard";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";

const Dashboard = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

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


  const handleItemSubmit = async (
    itemData: Omit<InventoryItem, "id" | "lastUpdated">,
    customData: Record<string, any> | undefined,
    actionType: string | any,
    notes: string
  ) => {
    if (!companyId) {
      toast.error("Company information not loaded");
      return;
    }
    if (!actionType) {
      toast.error("No action selected");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const existingItem = items.find(
        (item) => item.name.toLowerCase() === itemData.name.toLowerCase()
      );

      if (actionType === "add_new") {
        if (existingItem) {
          toast.error("Item name already exists. Use 'Add to Existing' action instead.");
          return;
        }

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
          transaction_type: "add_new",
          quantity: newItem.quantity,
          reference_type: "item_creation",
          notes: notes || "New item created",
        });
        toast.success("New item added successfully");

      } else {
        if (!existingItem) {
          toast.error("Item not found. Cannot apply adjustment to a non-existent item.");
          return;
        }

        // Determine if the change is positive or negative
        const isNegative = ["damaged_goods", "sample", "correction"].includes(actionType);
        const changeAmount = Number(itemData.quantity);
        const quantityChange = isNegative ? -changeAmount : changeAmount;

        const newQuantity = existingItem.quantity + quantityChange;

        // Add a guard against negative inventory
        if (newQuantity < 0) {
          toast.error(`Operation failed. Cannot set "${existingItem.name}" quantity below zero.`);
          return;
        }

        // Update the item's quantity
        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;

        // Log the specific adjustment transaction
        await supabase.from("inventory_transactions").insert({
          company_id: companyId,
          inventory_item_id: existingItem.id,
          transaction_type: actionType, // e.g., 'damaged_goods', 'returns'
          quantity: quantityChange,      // The signed change, e.g., -5 or +10
          reference_type: "manual_adjustment",
          notes: notes || "Manual stock adjustment",
        });

        toast.success(`Stock updated for ${existingItem.name}`);
      }

      fetchItems(); // Refresh the list after any successful operation
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
      <AppHeader
        companyName={companyName}
        pageTitle="Inventory"
        pageSubtitle="Track and manage your inventory"
        activePage="inventory"
      >
        <AddItemDialog onAdd={handleItemSubmit} items={items} />
      </AppHeader>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <InventoryStats
            totalItems={items.length}
            rawMaterials={rawMaterials.length}
            finishedProducts={finishedProducts.length}
            lowStock={lowStockItems.length}
          />

          <PendingOrdersCard companyId={companyId} />

          <Tabs defaultValue="all" className="spacey-4">
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