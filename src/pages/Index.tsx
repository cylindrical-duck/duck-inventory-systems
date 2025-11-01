import { useState } from "react";
import { InventoryStats } from "@/components/InventoryStats";
import { InventoryTable, InventoryItem } from "@/components/InventoryTable";
import { AddItemDialog } from "@/components/AddItemDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Package, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const initialItems: InventoryItem[] = [
  {
    id: "1",
    name: "All-purpose flour",
    category: "raw",
    quantity: 450,
    unit: "kg",
    reorderLevel: 100,
    lastUpdated: "2025-10-28",
  },
  {
    id: "2",
    name: "Chocolate chips",
    category: "raw",
    quantity: 75,
    unit: "kg",
    reorderLevel: 50,
    lastUpdated: "2025-10-29",
  },
  {
    id: "3",
    name: "Chocolate Chip Cookies",
    category: "finished",
    quantity: 1200,
    unit: "units",
    reorderLevel: 300,
    lastUpdated: "2025-10-30",
  },
  {
    id: "4",
    name: "Sea Salt Caramel Cookies",
    category: "finished",
    quantity: 45,
    unit: "units",
    reorderLevel: 200,
    lastUpdated: "2025-10-30",
  },
  {
    id: "5",
    name: "Glass bottles (500ml)",
    category: "raw",
    quantity: 0,
    unit: "units",
    reorderLevel: 500,
    lastUpdated: "2025-10-25",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>(initialItems);

  const handleAddItem = (newItem: Omit<InventoryItem, "id" | "lastUpdated">) => {
    const item: InventoryItem = {
      ...newItem,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    setItems([...items, item]);
    toast.success("Item added successfully");
  };

  const handleEditItem = (item: InventoryItem) => {
    toast.info("Edit functionality coming soon!");
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    toast.success("Item deleted successfully");
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
                <h1 className="text-2xl font-bold text-foreground">InventoryPro</h1>
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

export default Index;
