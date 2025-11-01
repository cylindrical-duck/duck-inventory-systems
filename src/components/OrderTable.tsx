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

interface OrderTableProps {
  orders: Order[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
}

const OrderTable = ({ orders, onDelete, onUpdateStatus }: OrderTableProps) => {
  const getStatusVariant = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "pending":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <Table>
        <TableHeader>
          <TableRow className="border-primary/20 hover:bg-primary/5">
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
              className="border-primary/10 hover:bg-primary/5"
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
                      <Eye className="h-4 w-4" />
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
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <Badge variant="default">Pending</Badge>
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
