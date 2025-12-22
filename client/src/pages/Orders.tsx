import { Layout } from "@/components/layout/Layout";
import { useStore, Order } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, Ban, Printer, Save, X, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Orders() {
  const store = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Payment Dialog State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Bank">("Cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState("");

  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editedItems, setEditedItems] = useState<{ id: string; description: string; quantity: number; price: number; discount?: number }[]>([]);
  const [isEditingOrderDate, setIsEditingOrderDate] = useState(false);

  // Payment Editing State
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editedPaymentData, setEditedPaymentData] = useState<any>(null);
  const [pendingUpdates, setPendingUpdates] = useState<any>({}); // Track status changes

  // Filter orders
  const filteredOrders = store.orders.filter(order =>
    order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.phone.includes(searchTerm)
  ).sort((a, b) => {
    const dateA = new Date(a.orderDate).getTime();
    const dateB = new Date(b.orderDate).getTime();
    return dateB - dateA; // Descending
  });

  // Group by Month
  const groupedOrders = filteredOrders.reduce((acc, order) => {
    const monthYear = format(parseISO(order.orderDate), 'MMMM yyyy');
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const formatDisplayDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      return format(parseISO(dateStr), 'dd-MM-yyyy');
    } catch (e) {
      return dateStr;
    }
  };


  const handleUpdateWorkStatus = (status: string) => {
    if (selectedOrder) {
      // Defer update
      setPendingUpdates((prev: any) => ({ ...prev, workStatus: status }));

      // Update UI explicitly for immediate feedback
      setSelectedOrder({ ...selectedOrder, ...pendingUpdates, workStatus: status as any });
    }
  };
  const handleUpdateDeliveryStatus = (status: string) => {
    if (selectedOrder) {
      setPendingUpdates((prev: any) => ({ ...prev, deliveryStatus: status }));
      setSelectedOrder({ ...selectedOrder, ...pendingUpdates, deliveryStatus: status as any });
    }
  };

  const handleUpdateOrderDate = (date: string) => {
    if (selectedOrder) {
      setPendingUpdates((prev: any) => ({ ...prev, orderDate: date }));
      // Update local state immediately for visual feedback
      setSelectedOrder({ ...selectedOrder, ...pendingUpdates, orderDate: date });
    }
  };


  const handleSaveChanges = async () => {
    if (selectedOrder && Object.keys(pendingUpdates).length > 0) {
      await store.updateOrder(selectedOrder.id, pendingUpdates);
      toast({ title: "Order Changes Saved" });
      setPendingUpdates({});
      setIsEditDialogOpen(false);
    } else {
      setIsEditDialogOpen(false);
    }
  };

  const handleAddPayment = () => {
    if (selectedOrder && paymentAmount) {
      store.addOrderPayment(
        selectedOrder.id,
        Number(paymentAmount),
        paymentMode,
        paymentDate,
        paymentNote
      );
      setPaymentAmount("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentNote("");
      toast({ title: "Payment Recorded" });
      // Close dialog or update local selectedOrder to reflect changes?
      // Store updates automatically, but selectedOrder is a snapshot.
      // We need to re-fetch or rely on the dialog closing.
      setIsEditDialogOpen(false);
    }
  };

  const handleCancelOrder = () => {
    if (selectedOrder) {
      if (confirm("Are you sure you want to cancel this order?")) {
        store.cancelOrder(selectedOrder.id);
        setIsEditDialogOpen(false);
        toast({ title: "Order Cancelled" });
      }
    }
  };

  const handleDeleteOrder = () => {
    if (selectedOrder) {
      if (confirm("Are you sure you want to PERMANENTLY delete this order?")) {
        store.deleteOrder(selectedOrder.id);
        setIsEditDialogOpen(false);
        toast({ title: "Order Deleted", variant: "destructive" });
      }
    }
  };

  const handleStartEditItems = () => {
    if (selectedOrder) {
      setEditedItems(JSON.parse(JSON.stringify(selectedOrder.items)));
      setIsEditingItems(true);
    }
  };

  const handleSaveItems = async () => {
    if (!selectedOrder) return;

    const newTotal = editedItems.reduce((sum, item) => sum + ((Number(item.price) * Number(item.quantity)) - (Number(item.discount || 0))), 0);
    const totalPaid = selectedOrder.totalAmount - selectedOrder.balanceAmount;
    const newBalance = newTotal - totalPaid;

    await store.updateOrder(selectedOrder.id, {
      items: editedItems,
      totalAmount: newTotal,
      balanceAmount: newBalance,
      // If balance becomes negative (overpaid), we might need to handle that, 
      // but simple math works for now. 
      paymentStatus: newBalance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid')
    });

    // Update the local selectedOrder to reflect changes immediately for the UI
    setSelectedOrder({
      ...selectedOrder,
      items: editedItems,
      totalAmount: newTotal,
      balanceAmount: newBalance,
      paymentStatus: newBalance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid')
    });

    setIsEditingItems(false);
    toast({ title: "Order Items Updated" });
  };

  const updateEditedItem = (index: number, field: string, value: any) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedItems(newItems);
  };

  const removeEditedItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const addEditedItem = () => {
    setEditedItems([...editedItems, { id: Math.random().toString(), description: "", quantity: 1, price: 0, discount: 0 }]);
  };

  const handleStartEditPayment = (payment: any) => {
    setEditingPaymentId(payment.id);
    setEditedPaymentData({ ...payment });
  };

  const handleSavePayment = async () => {
    if (!selectedOrder || !editedPaymentData) return;

    // Refresh data to ensure balances are up to date
    await store.loadData();

    // Find original payment to calculate balance adjustments
    // We must find it in the FRESH store data if possible, or use selectedOrder (which might be slightly stale but has the ID)
    // Actually, selectedOrder is local state. We should trust it for the ID.
    const originalPayment = selectedOrder.paymentHistory.find(p => p.id === editingPaymentId);

    if (originalPayment) {
      let newBank = store.bankBalance;
      let newCash = store.cashInHand;

      // Ensure we work with numbers
      const oldAmount = Number(originalPayment.amount);
      const newAmount = Number(editedPaymentData.amount);

      // 1. Reverse original payment
      if (originalPayment.mode === 'Cash') {
        newCash -= oldAmount;
      } else {
        newBank -= oldAmount;
      }

      // 2. Apply new payment
      if (editedPaymentData.mode === 'Cash') {
        newCash += newAmount;
      } else {
        newBank += newAmount;
      }

      // 3. Update balances if changed
      // Always update if there's any change in amounts or mode
      if (originalPayment.amount !== editedPaymentData.amount || originalPayment.mode !== editedPaymentData.mode) {
        await store.updateBalances({
          bankBalance: newBank.toString(),
          cashInHand: newCash.toString(),
        });
      }
    }

    const newPaymentHistory = selectedOrder.paymentHistory.map(p =>
      p.id === editingPaymentId ? { ...editedPaymentData, amount: Number(editedPaymentData.amount) } : p
    );

    // Recalculate totals
    const totalPaid = newPaymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);
    const newBalance = selectedOrder.totalAmount - totalPaid;

    await store.updateOrder(selectedOrder.id, {
      paymentHistory: newPaymentHistory,
      balanceAmount: newBalance,
      paymentStatus: newBalance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid')
    });

    setSelectedOrder({
      ...selectedOrder,
      paymentHistory: newPaymentHistory,
      balanceAmount: newBalance,
      paymentStatus: newBalance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid')
    });

    setEditingPaymentId(null);
    setEditedPaymentData(null);
    toast({ title: "Payment Updated" });
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!selectedOrder) return;
    if (!confirm("Are you sure you want to delete this payment?")) return;

    // Find payment to reverse balance
    const paymentToDelete = selectedOrder.paymentHistory.find(p => p.id === paymentId);
    if (paymentToDelete) {
      let newBank = store.bankBalance;
      let newCash = store.cashInHand;

      // Reverse payment
      if (paymentToDelete.mode === 'Cash') {
        newCash -= Number(paymentToDelete.amount);
      } else {
        newBank -= Number(paymentToDelete.amount);
      }

      await store.updateBalances({
        bankBalance: newBank.toString(),
        cashInHand: newCash.toString(),
      });
    }

    const newPaymentHistory = selectedOrder.paymentHistory.filter(p => p.id !== paymentId);

    // Recalculate totals
    const totalPaid = newPaymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);
    const newBalance = selectedOrder.totalAmount - totalPaid;

    await store.updateOrder(selectedOrder.id, {
      paymentHistory: newPaymentHistory,
      balanceAmount: newBalance,
      paymentStatus: newBalance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid')
    });

    setSelectedOrder({
      ...selectedOrder,
      paymentHistory: newPaymentHistory,
      balanceAmount: newBalance,
      paymentStatus: newBalance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid')
    });
    toast({ title: "Payment Deleted" });
  };

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
            <p className="text-muted-foreground">Manage order status and payments</p>
          </div>
          <div className="flex w-full md:w-auto gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Client or Order #"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Button>
          </div>
        </div>

        {Object.keys(groupedOrders).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No orders found</div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(groupedOrders).map(([month, monthOrders]) => {
              // Calculate month statistics
              const totalValue = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
              const ordersCount = monthOrders.length;

              return (
                <AccordionItem key={month} value={month}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between w-full pr-4">
                      <span className="font-semibold">{month}</span>
                      <div className="flex gap-4 text-sm font-normal text-muted-foreground">
                        <span>{ordersCount} Orders</span>
                        <span className="text-primary font-medium">Total: ₹{totalValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>ORDER NO</TableHead>
                          <TableHead>DATE</TableHead>
                          <TableHead>CLIENT</TableHead>
                          <TableHead>ITEMS</TableHead>
                          <TableHead>WORK STATUS</TableHead>
                          <TableHead>DELIVERY STATUS</TableHead>
                          <TableHead>PAYMENT</TableHead>
                          <TableHead className="text-right">TOTAL</TableHead>
                          <TableHead className="text-right">BALANCE</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthOrders.map((order) => (
                          <>
                            <TableRow
                              key={order.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                setSelectedOrder(order);
                                setPendingUpdates({});
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <TableCell onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(order.id);
                              }}>
                                {expandedRow === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </TableCell>
                              <TableCell className="font-medium">{order.orderNumber}</TableCell>
                              <TableCell>{formatDisplayDate(order.orderDate)}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{order.clientName}</div>
                                  <div className="text-xs text-muted-foreground">{order.phone}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {order.items.map(i => i.quantity + " x " + i.description).join(", ")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                      ${order.workStatus === 'Ready' ? 'bg-green-100 text-green-700' :
                                    order.workStatus === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                      order.workStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'}`}>
                                  {order.workStatus}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                      ${order.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                                    order.deliveryStatus === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' :
                                      order.deliveryStatus === 'Returned' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'}`}>
                                  {order.deliveryStatus}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                      ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                    order.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'}`}>
                                  {order.paymentStatus}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">₹{order.totalAmount.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-medium text-red-600">
                                {order.paymentStatus !== 'Paid' ? `₹${Number(order.balanceAmount).toLocaleString()}` : '-'}
                              </TableCell>
                            </TableRow>
                            {expandedRow === order.id && (
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={9}>
                                  <div className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-semibold mb-2">Item Details</h4>
                                        <div className="text-sm space-y-1">
                                          {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between gap-8">
                                              <span>{item.description} (x{item.quantity})</span>
                                              <span>₹{item.price}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold mb-2">Payment History</h4>
                                        <div className="text-sm space-y-1">
                                          {order.paymentHistory.length === 0 ? (
                                            <span className="text-muted-foreground">No payments recorded</span>
                                          ) : (
                                            order.paymentHistory.map((p, idx) => (
                                              <div key={idx} className="flex gap-4">
                                                <span className="text-muted-foreground">{formatDisplayDate(p.date)}</span>
                                                <span className="font-medium">₹{p.amount}</span>
                                                <span className="text-xs px-1.5 py-0.5 bg-secondary rounded">{p.mode}</span>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {order.notes && (
                                      <div className="mt-2 text-sm text-muted-foreground border-t pt-2">
                                        <strong>Note: </strong> {order.notes}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsEditDialogOpen(false);
            setPendingUpdates({});
          }
        }}>
          {selectedOrder && (
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Order #{selectedOrder.orderNumber}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => window.open(`/print-bill/${selectedOrder.id}`, '_blank')}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDeleteOrder}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {/* Order Date - Editable */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <Label>Client Details</Label>
                  <div className="mt-1 font-medium text-lg">{selectedOrder.clientName}</div>
                  <div className="text-muted-foreground">{selectedOrder.phone}</div>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    Order Date
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="date"
                      value={selectedOrder.orderDate ? selectedOrder.orderDate.split('T')[0] : ''}
                      onChange={(e) => handleUpdateOrderDate(e.target.value)}
                      className="w-[160px]"
                    />
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-2">Balance Amount</Label>
                  <div className="mt-1 text-2xl font-bold text-red-600">
                    ₹{selectedOrder.balanceAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label>Work Status</Label>
                  <Select
                    value={selectedOrder.workStatus}
                    onValueChange={handleUpdateWorkStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Ready">Ready</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Delivery Status</Label>
                  <Select
                    value={selectedOrder.deliveryStatus}
                    onValueChange={handleUpdateDeliveryStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Order Items</h3>
                  {!isEditingItems ? (
                    <Button variant="secondary" size="sm" onClick={handleStartEditItems}>
                      <Edit2 className="h-3 w-3 mr-2" /> Edit Items
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditingItems(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveItems}>Save Items</Button>
                    </div>
                  )}
                </div>

                <div className="border rounded-md p-4 space-y-2">
                  {/* Edit Mode */}
                  {isEditingItems ? (
                    <div className="space-y-4">
                      {editedItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end border-b pb-4 last:border-0 last:pb-0">
                          <div className="col-span-5">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateEditedItem(idx, 'description', e.target.value)}
                              placeholder="Item Name"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Qty</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateEditedItem(idx, 'quantity', Number(e.target.value))}
                            />
                          </div>
                          <div className="col-span-3">
                            <Label className="text-xs">Price</Label>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateEditedItem(idx, 'price', Number(e.target.value))}
                            />
                          </div>
                          <div className="col-span-2">
                            <Button variant="ghost" size="icon" className="text-destructive mt-4" onClick={() => removeEditedItem(idx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full" onClick={addEditedItem}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                      </Button>
                    </div>
                  ) : (
                    // View Mode
                    <div className="divide-y">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex justify-between py-2">
                          <span>{item.description} <span className="text-muted-foreground">x{item.quantity}</span></span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isEditingItems && (
                    <div className="flex justify-between pt-4 font-bold border-t">
                      <span>Total Amount</span>
                      <span>₹{selectedOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Payments</h3>

                {/* Payment History List with Edit/Delete */}
                {selectedOrder.paymentHistory.length > 0 && (
                  <div className="border rounded-md divide-y">
                    {selectedOrder.paymentHistory.map((payment) => (
                      <div key={payment.id} className="p-3 flex items-center justify-between">
                        {editingPaymentId === payment.id ? (
                          // Editing Payment Row
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                            <Input
                              type="date"
                              value={editedPaymentData.date}
                              onChange={(e) => setEditedPaymentData({ ...editedPaymentData, date: e.target.value })}
                            />
                            <Input
                              type="number"
                              value={editedPaymentData.amount}
                              onChange={(e) => setEditedPaymentData({ ...editedPaymentData, amount: e.target.value })}
                            />
                            <Select
                              value={editedPaymentData.mode}
                              onValueChange={(val) => setEditedPaymentData({ ...editedPaymentData, mode: val })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Bank">Bank</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex gap-1 justify-end">
                              <Button size="icon" variant="ghost" onClick={() => setEditingPaymentId(null)}><X className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" className="text-green-600" onClick={handleSavePayment}><Save className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ) : (
                          // View Payment Row
                          <>
                            <div className="flex flex-col md:flex-row md:gap-6">
                              <span className="text-muted-foreground w-24">{formatDisplayDate(payment.date)}</span>
                              <span className="font-medium w-24">₹{payment.amount}</span>
                              <span className="text-sm px-2 py-0.5 bg-secondary rounded w-fit">{payment.mode}</span>
                              {payment.note && <span className="text-sm text-muted-foreground italic">"{payment.note}"</span>}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEditPayment(payment)}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePayment(payment.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Payment */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                  <div className="font-medium text-sm">Record New Payment</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                    <Select
                      value={paymentMode}
                      onValueChange={(value: "Cash" | "UPI" | "Bank") => setPaymentMode(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Bank">Bank Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                  <Input
                    placeholder="Note (Optional)"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleAddPayment}>
                    Add Payment
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Close</Button>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </Layout>
  );
}
