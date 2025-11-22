import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBranding } from "../context/BrandingContext"; // <-- 1. IMPORT THE HOOK

// --- Interfaces ---
export interface InventoryItem {
  id: string;
  name: string;
  category: "raw" | "finished";
  quantity: number;
  unit: string;
  reorderLevel: number;
  lastUpdated: string;
  price: number;
}

export interface Shipment {
  id: string;
  status: "scheduled" | "in_transit" | "delivered" | "cancelled";
  items?: Array<{ itemName: string; quantity: number }>;
}

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export const InventoryTable = ({ items, onEdit, onDelete }: InventoryTableProps) => {
  const { primaryColor, accentColor } = useBranding(); // <-- 2. GET THE DYNAMIC COLOR
  const [searchQuery, setSearchQuery] = useState("");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch Shipments on Mount ---
  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      // Note: In a real app, ensure you filter by company_id here if needed
      const { data: shipmentsData, error } = await supabase
        .from("shipments")
        .select(`
          id,
          status,
          orders!shipments_order_id_fkey (
            order_items (
              item_name,
              quantity
            )
          )
        `);

      if (error) throw error;

      const formattedShipments: Shipment[] = (shipmentsData || []).map((shipment: any) => ({
        id: shipment.id,
        status: shipment.status,
        items: shipment.orders?.order_items?.map((item: any) => ({
          itemName: item.item_name,
          quantity: item.quantity,
        })) || [],
      }));

      setShipments(formattedShipments);
    } catch (error: any) {
      console.error("Error fetching shipments:", error);
      toast.error("Failed to load shipment data for calculations");
    } finally {
      setLoading(false);
    }
  };

  // --- Calculation Logic ---
  const calculatePhysicalStock = (item: InventoryItem) => {
    // 1. Start with the current database quantity
    let physicalTotal = item.quantity;

    // 2. Loop through all shipments
    shipments.forEach((shipment) => {
      // 3. Only look at 'scheduled' shipments
      if (shipment.status === "scheduled" && shipment.items) {
        // 4. Find items in this shipment that match the current inventory item
        const matchingItems = shipment.items.filter(
          (shipItem) => shipItem.itemName.toLowerCase() === item.name.toLowerCase()
        );

        // 5. Add their quantities to the total
        matchingItems.forEach((match) => {
          physicalTotal += match.quantity;
        });
      }
    });

    return physicalTotal;
  };

  // --- Filtering ---
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity <= reorderLevel) return { label: "Low Stock", variant: "warning" as const };
    return { label: "In Stock", variant: "success" as const };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {/* 3. APPLY DYNAMIC COLOR TO ICONS */}
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            style={{ color: primaryColor }}
          />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-[var(--shadow-soft)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Available Qty</TableHead>
              <TableHead className="bg-muted/30">Physical Inv.</TableHead> {/* Highlighted Column */}
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground h-32">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const status = getStockStatus(item.quantity, item.reorderLevel);
                const physicalQty = calculatePhysicalStock(item); // Calculate here

                return (
                  <TableRow key={item.id} className="border-border">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    {/* --- 4. APPLY DYNAMIC STYLING TO BADGE --- */}
                    <TableCell>
                      {item.category === "raw" ? (
                        <Badge className="text-primary-foreground" style={{ backgroundColor: accentColor }}>Raw Material</Badge>
                      ) : (
                        <Badge
                          style={{ backgroundColor: primaryColor }}
                          className="text-primary-foreground"
                        >
                          Finished Product
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.quantity} {item.unit}
                    </TableCell>

                    {/* Physical Inventory Column */}
                    <TableCell className="bg-muted/30 font-semibold">
                      {loading ? (
                        <span className="text-muted-foreground text-xs">Calc...</span>
                      ) : (
                        `${physicalQty} ${item.unit}`
                      )}
                    </TableCell>

                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.lastUpdated}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* 3. APPLY DYNAMIC COLOR TO ICONS */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(item)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" style={{ color: primaryColor }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};