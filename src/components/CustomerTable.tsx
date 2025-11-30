import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { Customer } from "@/pages/Customers"; // Import the new interface
import { useBranding } from "../context/BrandingContext";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (id: string) => void;
    loading: boolean;
}

const CustomerTable = ({ customers, onEdit, onDelete, loading }: CustomerTableProps) => {
    const { primaryColor } = useBranding();

    const renderSkeletons = () => {
        return Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={`skel-${i}`}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
            </TableRow>
        ));
    };

    return (
        <Card
            className="bg-card/50 backdrop-blur"
            style={{ borderColor: `${primaryColor}33` }} // ~20% opacity
        >
            <Table>
                <TableHeader>
                    <TableRow
                        className="hover:bg-muted-foreground/10"
                        style={{ borderColor: `${primaryColor}33` }}
                    >
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? renderSkeletons() : (
                        customers.length > 0 ? customers.map((customer) => (
                            <TableRow
                                key={customer.id}
                                className="hover:bg-muted-foreground/10"
                                style={{ borderColor: `${primaryColor}1A` }} // ~10% opacity
                            >
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                                <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {new Date(customer.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(customer)}
                                        className="text-muted-foreground hover:text-primary"
                                    >
                                        <Pencil className="h-4 w-4" style={{ color: primaryColor }} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(customer.id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        )
                    )}
                </TableBody>
            </Table>
        </Card>
    );
};

export default CustomerTable;