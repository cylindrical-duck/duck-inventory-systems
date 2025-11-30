
import { useState, useEffect } from "react";
import CustomerStats from "../components/CustomerStats";
import CustomerTable from "../components/CustomerTable";
import AddCustomerDialog from "../components/AddCustomerDialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";

export interface Customer {
    id: string;
    created_at: string;
    company_id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
}

const Customers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string>("");

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (companyId) {
            fetchCustomers();
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

    const fetchCustomers = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("customers")
                .select("*")
                .eq("company_id", companyId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCustomers(data || []);
        } catch (error: any) {
            toast.error("Failed to load customers");
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = async (
        customer: Omit<Customer, "id" | "created_at" | "company_id" | "user_id">,
    ) => {
        if (!companyId) {
            toast.error("Company information not loaded");
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data: newCustomer, error } = await supabase
                .from("customers")
                .insert({
                    ...customer,
                    company_id: companyId,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    toast.error("A customer with this email already exists.");
                } else {
                    throw error;
                }
            } else {
                toast.success("Customer added successfully");
                fetchCustomers();
            }
        } catch (error: any) {
            toast.error("Failed to add customer");
            console.error("Error adding customer:", error);
        }
    };

    const handleDeleteCustomer = async (id: string) => {
        try {
            const { error } = await supabase
                .from("customers")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast.success("Customer deleted successfully");
            fetchCustomers();
        } catch (error: any) {
            toast.error("Failed to delete customer");
            console.error("Error deleting customer:", error);
        }
    };

    const handleEditCustomer = (customer: Customer) => {
        toast.info("Edit functionality coming soon!");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <AppHeader
                companyName={companyName}
                pageTitle="Customers"
                pageSubtitle="Manage your customer database"
                activePage="customers"
            >
                <AddCustomerDialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    onAdd={handleAddCustomer}
                    companyId={companyId}
                />
            </AppHeader>

            <div className="container mx-auto p-6 space-y-8">
                <CustomerStats customers={customers} />

                <CustomerTable
                    customers={customers}
                    onEdit={handleEditCustomer}
                    onDelete={handleDeleteCustomer}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default Customers;