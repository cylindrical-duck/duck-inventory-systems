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
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye } from "lucide-react";
import { Shipment } from "@/pages/Shipping";
import { format } from "date-fns";
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

interface ShippingTableProps {
  shipments: Shipment[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Shipment["status"]) => void;
}

const ShippingTable = ({ shipments, onDelete, onUpdateStatus }: ShippingTableProps) => {
  const getStatusVariant = (status: Shipment["status"]) => {
    switch (status) {
      case "scheduled":
        return "secondary";
      case "in_transit":
        return "default";
      case "delivered":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shipment #</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Shipped Date</TableHead>
            <TableHead>Tracking</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id}>
              <TableCell className="font-medium">
                {shipment.shipmentNumber}
                {shipment.orderNumber && (
                  <div className="text-xs text-muted-foreground">
                    Order: {shipment.orderNumber}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{getTypeLabel(shipment.shipmentType)}</Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">{shipment.recipientName}</div>
                {shipment.recipientEmail && (
                  <div className="text-xs text-muted-foreground">{shipment.recipientEmail}</div>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(shipment.scheduledDate), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                {shipment.shippedDate
                  ? format(new Date(shipment.shippedDate), "MMM dd, yyyy")
                  : "-"}
              </TableCell>
              <TableCell>
                {shipment.trackingNumber ? (
                  <div>
                    <div className="font-medium text-xs">{shipment.trackingNumber}</div>
                    {shipment.carrier && (
                      <div className="text-xs text-muted-foreground">{shipment.carrier}</div>
                    )}
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <Select
                  value={shipment.status}
                  onValueChange={(value) => onUpdateStatus(shipment.id, value as Shipment["status"])}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      <Badge variant={getStatusVariant(shipment.status)}>
                        {shipment.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      <Badge variant="secondary">Scheduled</Badge>
                    </SelectItem>
                    <SelectItem value="in_transit">
                      <Badge variant="default">In Transit</Badge>
                    </SelectItem>
                    <SelectItem value="delivered">
                      <Badge variant="outline">Delivered</Badge>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <Badge variant="destructive">Cancelled</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {shipment.items && shipment.items.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Shipment Items</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          {shipment.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between p-2 border rounded">
                              <span>{item.itemName}</span>
                              <span className="font-medium">Qty: {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(shipment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default ShippingTable;
