import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ReportInventoryItem {
    id: string;
    name: string;
}

interface Transaction {
    id: string;
    created_at: string;
    transaction_type: string;
    quantity: number;
    reference_type: string | null;
    notes: string | null;
}

interface ItemTransactionHistoryProps {
    companyId: string;
    items: ReportInventoryItem[];
}

export const ItemTransactionHistory = ({ companyId, items }: ItemTransactionHistoryProps) => {
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    // 'transactions' will hold the data fetched in ASCENDING order (oldest first)
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!selectedItemId) {
                setTransactions([]);
                return;
            }

            setLoadingTransactions(true);
            try {
                const { data, error } = await supabase
                    .from("inventory_transactions")
                    .select("id, created_at, transaction_type, quantity, reference_type, notes")
                    .eq("company_id", companyId)
                    .eq("inventory_item_id", selectedItemId)
                    // STEP 1: Fetch in ASCENDING order for correct calculation
                    .order("created_at", { ascending: true });

                if (error) throw error;

                setTransactions(data as Transaction[]);

            } catch (error: any) {
                toast.error("Failed to load transactions.");
                console.error("Error fetching transactions:", error);
                setTransactions([]);
            } finally {
                setLoadingTransactions(false);
            }
        };

        fetchTransactions();
    }, [selectedItemId, companyId]);

    // STEP 2: Calculate the running stock level (this still requires ASC order)
    const transactionsWithRunningStock = transactions.reduce((acc, current) => {
        const lastStock = acc.length > 0 ? acc[acc.length - 1].runningStock : 0;
        // Calculation: last stock + current quantity
        const runningStock = lastStock + current.quantity;
        acc.push({ runningStock, ...current });
        return acc;
    }, [] as (Transaction & { runningStock: number })[]);

    // STEP 3: Reverse the array for DESCENDING display (newest on top)
    const reversedTransactions = [...transactionsWithRunningStock].reverse();


    const renderTransactionType = (type: string) => {
        let colorClass = "bg-gray-100 text-gray-800";
        if (["shipment", "restock", "returns", "add_new"].includes(type)) {
            colorClass = "bg-green-100 text-green-800";
        } else if (["order", "damaged_goods", "sample", "correction"].includes(type)) {
            colorClass = "bg-red-100 text-red-800";
        }
        return <Badge className={`capitalize ${colorClass}`}>{type.replace(/_/g, ' ')}</Badge>;
    };

    return (
        <div className="space-y-4">
            {/* Item Selection Dropdown */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Inventory Item:
                </label>
                <Select onValueChange={setSelectedItemId} value={selectedItemId || ""}>
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Choose an item..." />
                    </SelectTrigger>
                    <SelectContent>
                        {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                                {item.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Transaction Table */}
            <div className="mt-6 border rounded-lg overflow-hidden">
                {selectedItemId && loadingTransactions ? (
                    <div className="p-6 text-center text-gray-500">Loading transactions...</div>
                ) : selectedItemId && reversedTransactions.length === 0 && !loadingTransactions ? (
                    <div className="p-6 text-center text-gray-500">No transactions found for this item.</div>
                ) : selectedItemId && reversedTransactions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Quantity Change</TableHead>
                                <TableHead className="text-right">Running Stock</TableHead>
                                <TableHead>Reference/Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Map over the REVERSED array */}
                            {reversedTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                                    <TableCell>{renderTransactionType(tx.transaction_type)}</TableCell>
                                    <TableCell className={`text-right font-medium ${tx.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.quantity >= 0 ? `+${tx.quantity}` : tx.quantity}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{tx.runningStock}</TableCell>
                                    <TableCell>
                                        <p className="text-xs text-gray-500 capitalize">{tx.reference_type?.replace(/_/g, ' ')}</p>
                                        <p className="text-sm">{tx.notes}</p>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mt-8">
                        <p className="text-xl font-semibold text-gray-600">
                            Select an inventory item above to see transaction history.
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            The report details will appear here once an item is chosen.
                        </p>
                    </div>)}
            </div>
        </div>
    );
};