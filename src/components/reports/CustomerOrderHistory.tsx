import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// --- Types ---
interface Customer {
    id: string;
    name: string;
    email: string | null;
}

interface DetailedOrder {
    id: string;
    order_number: string;
    created_at: string;
    status: string; // From order_status ENUM
    total_amount: number;
    order_items: {
        item_name: string;
        quantity: number;
        price: number;
    }[];
}

interface CustomerOrderHistoryProps {
    companyId: string;
}

export const CustomerOrderHistory = ({ companyId }: CustomerOrderHistoryProps) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [orders, setOrders] = useState<DetailedOrder[]>([]);
    const [totalRevenue, setTotalRevenue] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    // 1. Fetch all customers for the dropdown
    useEffect(() => {
        const fetchCustomers = async () => {
            if (!companyId) return;

            try {
                const { data, error } = await supabase
                    .from("customers")
                    .select("id, name, email")
                    .eq("company_id", companyId)
                    .order("name", { ascending: true });

                if (error) throw error;
                setCustomers(data || []);
            } catch (error) {
                toast.error("Failed to load customer list.");
            }
        };
        fetchCustomers();
    }, [companyId]);

    // 2. Fetch orders and calculate revenue when a customer is selected
    useEffect(() => {
        const fetchOrdersAndCalculateRevenue = async () => {
            if (!selectedCustomerId) {
                setOrders([]);
                setTotalRevenue(0);
                return;
            }

            setLoading(true);
            try {
                // Fetch orders and join order_items in a single query (using a nested select)
                const { data, error } = await supabase
                    .from("orders")
                    .select(`
                        id,
                        order_number,
                        created_at,
                        status,
                        total_amount,
                        order_items (item_name, quantity, price)
                    `)
                    .eq("customer_id", selectedCustomerId)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                const fetchedOrders = data as DetailedOrder[];
                setOrders(fetchedOrders);

                // Calculate total revenue from fetched orders (only count completed orders)
                const revenue = fetchedOrders.reduce((sum, order) => {
                    // Assuming 'completed' is the status for recognized revenue
                    if (order.status === 'completed') {
                        return sum + Number(order.total_amount); // Ensure total_amount is treated as number
                    }
                    return sum;
                }, 0);

                setTotalRevenue(revenue);

            } catch (error) {
                toast.error("Failed to load customer order history.");
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrdersAndCalculateRevenue();
    }, [selectedCustomerId, companyId]);


    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);


    return (
        <div className="space-y-6">
            {/* Customer Selection Dropdown */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Customer:
                </label>
                <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId || ""}>
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Choose a customer..." />
                    </SelectTrigger>
                    <SelectContent>
                        {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} ({customer.email || 'No Email'})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* --- Conditional Content Display --- */}
            {!selectedCustomerId ? (
                // --- PLACEHOLDER MESSAGE ---
                <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mt-8">
                    <p className="text-xl font-semibold text-gray-600">
                        Select a customer above to see order history and sales metrics.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                        The report details will appear here once a customer is chosen.
                    </p>
                </div>
            ) : (
                <>
                    <h3 className="text-2xl font-bold mt-4">
                        Order History for {selectedCustomer?.name}
                    </h3>

                    <Tabs defaultValue="summary" className="w-full">
                        <TabsList>
                            <TabsTrigger value="summary">Revenue Summary</TabsTrigger>
                            <TabsTrigger value="details">Detailed Order List</TabsTrigger>
                        </TabsList>

                        {/* --- REVENUE SUMMARY TAB --- */}
                        <TabsContent value="summary" className="pt-4">
                            <div className="p-6 border rounded-lg bg-green-50 shadow-md">
                                <p className="text-sm text-gray-600">Total Revenue (Completed Orders):</p>
                                <p className="text-4xl font-extrabold text-green-700">
                                    {formatCurrency(totalRevenue)}
                                </p>
                            </div>
                        </TabsContent>

                        {/* --- DETAILED ORDER LIST TAB --- */}
                        <TabsContent value="details" className="pt-4">
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">Loading orders...</div>
                            ) : orders.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">No orders found for this customer.</div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order #</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead>Items</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orders.map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">{order.order_number}</TableCell>
                                                    <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                                                            {order.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(Number(order.total_amount))}</TableCell>
                                                    <TableCell>
                                                        <ul className="list-disc list-inside space-y-0.5 text-sm">
                                                            {order.order_items.map((item, index) => (
                                                                <li key={index}>
                                                                    {item.quantity}x {item.item_name}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
};