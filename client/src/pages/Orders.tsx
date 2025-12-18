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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, Ban, Printer, Save, X, Edit2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Orders() {
  const store = useStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Payment Dialog State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Bank">("Cash");
  const [paymentNote, setPaymentNote] = useState("");

  // Item Editing State
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editedItems, setEditedItems] = useState<{ id: string; description: string; quantity: number; price: number }[]>([]);

  // Payment Editing State
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editedPaymentData, setEditedPaymentData] = useState<any>(null);

  // Filter orders
  const filteredOrders = store.orders.filter(order =>
    order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.phone.includes(searchTerm)
  );

  const handleUpdateWorkStatus = (status: string) => {
    if (selectedOrder) {
      store.updateOrder(selectedOrder.id, { workStatus: status as any });
      toast({ title: "Work Status Updated" });
    }
  };

  const handleUpdateDeliveryStatus = (status: string) => {
    if (selectedOrder) {
      store.updateOrder(selectedOrder.id, { deliveryStatus: status as any });
      toast({ title: "Delivery Status Updated" });
    }
  };

  const handleAddPayment = () => {
    if (selectedOrder && paymentAmount) {
      store.addOrderPayment(
        selectedOrder.id,
        Number(paymentAmount),
        paymentMode,
        new Date().toISOString().split('T')[0],
        paymentNote
      );
      setPaymentAmount("");
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

    const newTotal = editedItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
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
    setEditedItems([...editedItems, { id: Math.random().toString(), description: "", quantity: 1, price: 0 }]);
  };

  const handleStartEditPayment = (payment: any) => {
    setEditingPaymentId(payment.id);
    setEditedPaymentData({ ...payment });
  };

  const handleSavePayment = async () => {
    if (!selectedOrder || !editedPaymentData) return;

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

    toast({ title: "Payment Deleted", variant: "destructive" });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Order Database</h2>
            <p className="text-muted-foreground">Track commissions, status, and payments.</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <a href="/billing">
              <Plus className="w-4 h-4 mr-2" /> New Order
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Phone / Name / ID..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-md bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>CLIENT</TableHead>
                <TableHead>ORDER DATE</TableHead>
                <TableHead>WORK STATUS</TableHead>
                <TableHead>DELIVERY</TableHead>
                <TableHead>PAYMENT</TableHead>
                <TableHead className="text-right">TOTAL</TableHead>
                <TableHead className="text-right">BALANCE</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order.clientName}</div>
                      <div className="text-xs text-muted-foreground">{order.phone}</div>
                    </TableCell>
                    <TableCell className="text-xs">{order.orderDate}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.workStatus === 'Ready' ? 'bg-green-100 text-green-700' :
                        order.workStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                        {order.workStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                        }`}>
                        {order.deliveryStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                        order.paymentStatus === 'Unpaid' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                        {order.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{order.totalAmount}</TableCell>
                    <TableCell className="text-right text-muted-foreground">₹{order.balanceAmount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/print-bill/${order.id}`, '_blank')}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Order: {selectedOrder?.orderNumber}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {selectedOrder?.orderDate}
                </span>
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6 py-4">
                {/* Order Items */}
                {/* Order Items */}
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-sm">Order Items</h3>
                    {!isEditingItems ? (
                      <Button variant="ghost" size="sm" onClick={handleStartEditItems} className="h-8">
                        <Edit2 className="w-3 h-3 mr-2" /> Edit Items
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingItems(false)} className="h-8 text-muted-foreground">
                          <X className="w-3 h-3 mr-2" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveItems} className="h-8">
                          <Save className="w-3 h-3 mr-2" /> Save
                        </Button>
                      </div>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right w-20">Qty</TableHead>
                        <TableHead className="text-right w-24">Rate</TableHead>
                        <TableHead className="text-right w-24">Amount</TableHead>
                        {isEditingItems && <TableHead className="w-10"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isEditingItems ? (
                        <>
                          {editedItems.map((item, index) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateEditedItem(index, 'description', e.target.value)}
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateEditedItem(index, 'quantity', Number(e.target.value))}
                                  className="h-8 text-right"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => updateEditedItem(index, 'price', Number(e.target.value))}
                                  className="h-8 text-right"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                ₹{(item.price * item.quantity)}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeEditedItem(index)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={5}>
                              <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addEditedItem}>
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                              </Button>
                            </TableCell>
                          </TableRow>
                        </>
                      ) : (
                        // Read Only View
                        selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{item.price}</TableCell>
                            <TableCell className="text-right">₹{item.price * item.quantity}</TableCell>
                          </TableRow>
                        ))
                      )}

                      {/* Total Row - changes based on mode */}
                      <TableRow>
                        <TableCell colSpan={3} className="font-bold text-right pt-4">Total Order Value</TableCell>
                        <TableCell className="font-bold text-right pt-4">
                          ₹{isEditingItems
                            ? editedItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)
                            : selectedOrder.totalAmount}
                        </TableCell>
                        {isEditingItems && <TableCell></TableCell>}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Status Updates */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <Label>Work Status</Label>
                    <Select
                      defaultValue={selectedOrder.workStatus}
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
                      defaultValue={selectedOrder.deliveryStatus}
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

                {/* Payment Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">Payment History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.paymentHistory.map(p => (
                        <TableRow key={p.id}>
                          {editingPaymentId === p.id ? (
                            <>
                              <TableCell>
                                <Input
                                  type="date"
                                  value={editedPaymentData.date}
                                  onChange={(e) => setEditedPaymentData({ ...editedPaymentData, date: e.target.value })}
                                  className="h-8 w-32"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={editedPaymentData.mode}
                                  onValueChange={(v) => setEditedPaymentData({ ...editedPaymentData, mode: v })}
                                >
                                  <SelectTrigger className="h-8 w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="Bank">Bank</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editedPaymentData.note}
                                  onChange={(e) => setEditedPaymentData({ ...editedPaymentData, note: e.target.value })}
                                  className="h-8 text-xs"
                                  placeholder="Note"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={editedPaymentData.amount}
                                  onChange={(e) => setEditedPaymentData({ ...editedPaymentData, amount: e.target.value })}
                                  className="h-8 w-24 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSavePayment}>
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingPaymentId(null)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>{p.date}</TableCell>
                              <TableCell>{p.mode}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{p.note}</TableCell>
                              <TableCell className="text-right">₹{p.amount}</TableCell>
                              <TableCell className="w-20 text-right">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleStartEditPayment(p)}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeletePayment(p.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="font-bold text-right">Total Paid</TableCell>
                        <TableCell className="font-bold text-right text-green-600">
                          ₹{selectedOrder.totalAmount - selectedOrder.balanceAmount}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="font-bold text-right">Balance Due</TableCell>
                        <TableCell className="font-bold text-right text-red-600">
                          ₹{selectedOrder.balanceAmount}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {selectedOrder.balanceAmount > 0 && (
                    <div className="bg-muted p-4 rounded-lg space-y-4">
                      <h4 className="font-medium text-sm">Add Partial Payment</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          placeholder="Amount"
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                        <Select
                          value={paymentMode}
                          onValueChange={(v: any) => setPaymentMode(v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Bank">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddPayment} size="sm">Record</Button>
                      </div>
                      <Input
                        placeholder="Note (Optional)"
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Destructive Actions */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelOrder}
                    disabled={selectedOrder.workStatus === 'Cancelled'}
                  >
                    <Ban className="w-4 h-4 mr-2" /> Cancel Order
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDeleteOrder}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Permanently
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
