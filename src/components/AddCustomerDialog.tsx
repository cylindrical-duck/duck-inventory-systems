import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users } from "lucide-react";
import { Customer } from "@/pages/Customers"; // Import the interface
import { useBranding } from "../context/BrandingContext";
import { toast } from "sonner";

interface AddCustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (
        customer: Omit<Customer, "id" | "created_at" | "company_id" | "user_id">
    ) => void;
    companyId: string | null; // <-- Now passed as a prop
}

const AddCustomerDialog = ({ open, onOpenChange, onAdd, companyId }: AddCustomerDialogProps) => {
    const { primaryColor, accentColor } = useBranding();
    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyId) {
            toast.error("Cannot add customer: Company ID is missing.");
            return;
        }
        if (!customerInfo.name || !customerInfo.email) {
            toast.error("Please fill in at least Name and Email.");
            return;
        }

        const newCustomer = {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: customerInfo.address,
        };

        onAdd(newCustomer);

        // Reset form
        setCustomerInfo({ name: "", email: "", phone: "", address: "" });
        onOpenChange(false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            // Reset form on close
            setCustomerInfo({ name: "", email: "", phone: "", address: "" });
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    className="text-primary-foreground"
                    style={{ backgroundColor: primaryColor }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Customer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Customer</DialogTitle>
                    <DialogDescription>
                        Add a new customer to your database.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Customer Information</h3>
                        <div className="space-y-2">
                            <Label htmlFor="customerName">Name *</Label>
                            <Input
                                id="customerName"
                                value={customerInfo.name}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customerEmail">Email *</Label>
                            <Input
                                id="customerEmail"
                                type="email"
                                value={customerInfo.email}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customerPhone">Phone</Label>
                            <Input
                                id="customerPhone"
                                type="tel"
                                value={customerInfo.phone}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customerAddress">Address</Label>
                            <Input
                                id="customerAddress"
                                value={customerInfo.address}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                placeholder="123 Main St, Anytown, USA"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="text-primary-foreground"
                            style={{ backgroundColor: primaryColor }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
                        >
                            Create Customer
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddCustomerDialog;