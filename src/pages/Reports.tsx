import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemTransactionHistory } from "@/components/reports/ItemTransactionHistory";
import { CustomerOrderHistory } from "@/components/reports/CustomerOrderHistory";
import { StockValuationSummary } from "@/components/reports/StockValuationSummary";
import { toast } from "sonner";

interface ReportInventoryItem {
    id: string;
    name: string;
}

const Reports = () => {
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string>("");
    const [inventoryItems, setInventoryItems] = useState<ReportInventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfileAndItems();
    }, []);

    const fetchProfileAndItems = async () => {
        setLoading(true);
        try {
            // 1. Fetch User and Profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            if (user.user_metadata?.company_name) {
                setCompanyName(user.user_metadata.company_name);
            }

            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("company_id")
                .eq("id", user.id)
                .single();

            if (profileError) throw profileError;
            const id = profileData.company_id;
            setCompanyId(id);

            // 2. Fetch Inventory Item Names/IDs (needed for the selection dropdown)
            const { data: itemsData, error: itemsError } = await supabase
                .from("inventory_items")
                .select("id, name")
                .eq("company_id", id);

            if (itemsError) throw itemsError;
            setInventoryItems(itemsData || []);

        } catch (error: any) {
            toast.error("Failed to load necessary data.");
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppHeader
                companyName={companyName}
                pageTitle="Reports"
                pageSubtitle="Generate business insights from your data"
                activePage="reports"
            />

            <main className="container mx-auto px-4 py-8">
                <Tabs defaultValue="transactions" className="spacey-4">
                    <TabsList className="bg-muted">
                        <TabsTrigger value="transactions">Item Transactions</TabsTrigger>
                        <TabsTrigger value="orders">Customer Orders</TabsTrigger>
                        <TabsTrigger value="valuation">Valuation Summary</TabsTrigger>
                    </TabsList>

                    <TabsContent value="transactions" className="space-y-4 pt-4">
                        <div className="p-4 border rounded-lg bg-card shadow">
                            <h2 className="text-xl font-semibold mb-4">Individual Item Transaction History</h2>

                            {loading ? (
                                <p>Loading...</p>
                            ) : companyId ? (
                                <ItemTransactionHistory
                                    companyId={companyId}
                                    items={inventoryItems}
                                />
                            ) : (
                                <p>Please log in to view reports.</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="orders" className="space-y-4 pt-4">
                        <div className="p-4 border rounded-lg bg-card shadow">
                            <h2 className="text-xl font-semibold mb-4">Customer Sales Performance</h2>
                            {loading ? (
                                <p>Loading...</p>
                            ) : companyId ? (
                                <CustomerOrderHistory
                                    companyId={companyId}
                                />
                            ) : (
                                <p>Please log in to view reports.</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="valuation" className="space-y-4 pt-4">
                        <div className="p-4 border rounded-lg bg-card shadow">
                            <h2 className="text-xl font-semibold mb-4">Current Stock Valuation</h2>
                            {loading ? (
                                <p>Loading...</p>
                            ) : companyId ? (
                                <StockValuationSummary
                                    companyId={companyId}
                                />
                            ) : (
                                <p>Please log in to view reports.</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default Reports;