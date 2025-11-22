import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Eye } from "lucide-react";
import { Order } from "@/pages/Orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBranding } from "../context/BrandingContext"; // <-- 1. IMPORT HOOK

interface OrderTableProps {
  orders: Order[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
}

const OrderTable = ({ orders, onDelete, onUpdateStatus }: OrderTableProps) => {
  // --- 2. GET BRANDING COLOR ---
  const { primaryColor } = useBranding();

  const getStatusVariant = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "pending":
        return "secondary"; // Use secondary as a fallback, we'll style 'pending' manually
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    // --- 3. APPLY DYNAMIC BORDER COLOR ---
    <Card
      className="bg-card/50 backdrop-blur"
      style={{ borderColor: `${primaryColor}33` }} // 33 is ~20% opacity
    >
      <Table>
        <TableHeader>
          {/* 3. APPLY DYNAMIC BORDER COLOR (removed hover) */}
          <TableRow
            className="hover:bg-muted-foreground/10" // Using neutral hover
            style={{ borderColor: `${primaryColor}33` }}
          >
            <TableHead>Order #</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="hover:bg-muted-foreground/10" // Using neutral hover
              style={{ borderColor: `${primaryColor}1A` }} // 1A is ~10% opacity
            >
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>{order.contactName}</TableCell>
              <TableCell className="text-muted-foreground">
                {order.contactEmail}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {order.contactPhone}
              </TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      {/* --- 4. APPLY DYNAMIC ICON COLOR --- */}
                      <Eye className="h-4 w-4" style={{ color: primaryColor }} />
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Order Items - {order.orderNumber}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">
                            ${(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
              <TableCell className="font-semibold">
                ${order.totalAmount.toFixed(2)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(order.orderDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Select
                  value={order.status}
                  onValueChange={(value) =>
                    onUpdateStatus(order.id, value as Order["status"])
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      {/* --- 5. DYNAMICALLY STYLE PENDING BADGE --- */}
                      {order.status === "pending" ? (
                        <Badge
                          style={{ backgroundColor: primaryColor }}
                          className="text-primary-foreground"
                        >
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {/* --- 5. DYNAMICALLY STYLE PENDING BADGE --- */}
                    <SelectItem value="pending">
                      <Badge
                        style={{ backgroundColor: primaryColor }}
                        className="text-primary-foreground"
                      >
                        Pending
                      </Badge>
                    </SelectItem>
                    <SelectItem value="processing">
                      <Badge variant="warning">Processing</Badge>
                    </SelectItem>
                    <SelectItem value="completed">
                      <Badge variant="success">Completed</Badge>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <Badge variant="destructive">Cancelled</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(order.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default OrderTable;