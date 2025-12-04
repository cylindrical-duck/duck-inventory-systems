import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Factory, FlaskConical } from "lucide-react";

// --- Types ---
interface ValuationData {
    totalItems: number;
    rawMaterialValue: number;
    finishedProductValue: number;
    overallTotalValue: number;
}

interface InventoryItemValue {
    category: "raw" | "finished";
    quantity: number;
    price: number; // Assuming this is the cost/value per unit
}

interface StockValuationSummaryProps {
    companyId: string;
}

export const StockValuationSummary = ({ companyId }: StockValuationSummaryProps) => {
    const [valuation, setValuation] = useState<ValuationData | null>(null);
    const [loading, setLoading] = useState(false);

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    useEffect(() => {
        const fetchValuationData = async () => {
            if (!companyId) return;

            setLoading(true);
            try {
                // Fetch all items with their quantity, price, and category
                const { data: itemsData, error } = await supabase
                    .from("inventory_items")
                    .select("category, quantity, price");

                if (error) throw error;

                let totalItems = 0;
                let rawMaterialValue = 0;
                let finishedProductValue = 0;

                (itemsData as InventoryItemValue[]).forEach(item => {
                    const itemPrice = item.price || 0; // Use 0 if price is null/undefined
                    const itemQuantity = item.quantity || 0;
                    const value = itemPrice * itemQuantity;

                    totalItems += itemQuantity;

                    if (item.category === 'raw') {
                        rawMaterialValue += value;
                    } else if (item.category === 'finished') {
                        finishedProductValue += value;
                    }
                });

                const overallTotalValue = rawMaterialValue + finishedProductValue;

                setValuation({
                    totalItems,
                    rawMaterialValue,
                    finishedProductValue,
                    overallTotalValue,
                });

            } catch (error) {
                toast.error("Failed to calculate stock valuation.");
                console.error("Error fetching valuation data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchValuationData();
    }, [companyId]);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Calculating valuation...</div>;
    }

    if (!valuation) {
        return <div className="p-6 text-center text-gray-500">No inventory data available for valuation.</div>;
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">
                Valuation is calculated as: **Quantity × Price per Unit** for all items.
            </p>

            {/* Main Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {/* Overall Total Value */}
                <Card className="shadow-lg border-2 border-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {formatCurrency(valuation.overallTotalValue)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {valuation.totalItems} units across all categories
                        </p>
                    </CardContent>
                </Card>

                {/* Raw Material Value */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Raw Material Value</CardTitle>
                        <FlaskConical className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(valuation.rawMaterialValue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Value of items categorized as "raw"
                        </p>
                    </CardContent>
                </Card>

                {/* Finished Product Value */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Finished Product Value</CardTitle>
                        <Factory className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(valuation.finishedProductValue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Value of items categorized as "finished"
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};