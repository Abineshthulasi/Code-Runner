import { Layout } from "@/components/layout/Layout";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parseISO, isBefore, startOfDay } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

export function StaffDashboard({ disableLayout = false }: { disableLayout?: boolean }) {
    const store = useStore();
    const today = startOfDay(new Date());

    // Helper date parser (handling different date formats if needed, but assuming ISO/YYYY-MM-DD from current implementation)
    const safeParseDate = (dateStr: string) => {
        try {
            return parseISO(dateStr);
        } catch (e) {
            return new Date();
        }
    };

    // 1. Pending Order List
    // Assuming "Pending" means work is not yet ready/delivered/cancelled
    const pendingOrders = store.orders.filter(
        (o) => o.workStatus !== "Ready" && o.workStatus !== "Cancelled" && o.deliveryStatus !== "Delivered"
    );

    // 2. Recent Order Taken List
    const recentOrders = [...store.orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

    // 3. Delivered List
    const deliveredOrders = store.orders
        .filter((o) => o.deliveryStatus === "Delivered")
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 10);

    // 4. Current Day Need to Delivery (Due Today)
    const dueTodayOrders = store.orders.filter((o) => {
        // dueDate is stored as string YYYY-MM-DD
        return o.dueDate === format(today, 'yyyy-MM-dd') && o.deliveryStatus !== 'Delivered';
    });

    // 5. Outstanding Delivery Order List (Overdue)
    const outstandingOrders = store.orders.filter((o) => {
        const dueDate = parseISO(o.dueDate);
        return isBefore(dueDate, today) && o.deliveryStatus !== 'Delivered' && o.workStatus !== 'Cancelled';
    });

    // 6. Pending Delivery List (Ready but not Delivered)
    const readyForDeliveryOrders = store.orders.filter(
        (o) => o.workStatus === 'Ready' && o.deliveryStatus !== 'Delivered'
    );

    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleRowClick = (order: any) => {
        setSelectedOrder(order);
        setIsDialogOpen(true);
    };

    const OrderTable = ({ orders, title, emptyMsg, showDateType = 'due' }: { orders: any[], title: string, emptyMsg: string, showDateType?: 'due' | 'order' | 'updated' }) => (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>{title} <Badge variant="secondary" className="ml-2">{orders.length}</Badge></CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Work Status</TableHead>
                                <TableHead>Delivery</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">{emptyMsg}</TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow
                                        key={order.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(order)}
                                    >
                                        <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                                        <TableCell>
                                            <div>{order.clientName}</div>
                                            <div className="text-xs text-muted-foreground">{order.phone}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {showDateType === 'order' ? format(parseISO(order.orderDate), 'dd-MM-yyyy') :
                                                        showDateType === 'updated' ? format(new Date(order.updatedAt || order.createdAt), 'dd-MM-yyyy') :
                                                            order.dueDate ? format(parseISO(order.dueDate), 'dd-MM-yyyy') : 'N/A'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground uppercase">
                                                    {showDateType === 'order' ? 'Ordered' :
                                                        showDateType === 'updated' ? 'Updated' : 'Due'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                order.workStatus === 'Ready' ? 'bg-green-50 text-green-700' :
                                                    order.workStatus === 'Pending' ? 'bg-yellow-50 text-yellow-700' : ''
                                            }>
                                                {order.workStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={
                                                    order.deliveryStatus === 'Delivered' ? 'bg-green-50 text-green-700' :
                                                        order.deliveryStatus === 'Pending' ? 'bg-gray-50 text-gray-700' : ''
                                                }>
                                                    {order.deliveryStatus}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-red-600 font-medium">
                                            ₹{order.balanceAmount}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );

    const content = (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Staff Dashboard</h2>
                <p className="text-muted-foreground">Overview of daily tasks and deliveries.</p>
            </div>

            {/* Priority: Due Today & Outstanding */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <CardTitle className="text-blue-700">Due for Delivery Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{dueTodayOrders.length}</div>
                        <p className="text-sm text-muted-foreground">Orders must be delivered by EOD.</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                        <CardTitle className="text-red-700">Outstanding / Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{outstandingOrders.length}</div>
                        <p className="text-sm text-muted-foreground">Orders past their due date.</p>
                    </CardContent>
                </Card>
            </div>

            <OrderTable orders={dueTodayOrders} title="🚨 Need to Delivery Today" emptyMsg="No deliveries scheduled for today." />

            <OrderTable orders={outstandingOrders} title="⚠️ Outstanding Deliveries" emptyMsg="No overdue orders." />

            <OrderTable orders={readyForDeliveryOrders} title="📦 Pending Delivery (Ready)" emptyMsg="No orders waiting for delivery." />

            <OrderTable orders={pendingOrders} title="⏳ Pending Works" emptyMsg="No pending works." />

            <OrderTable orders={recentOrders} title="📝 Recently Taken Orders" emptyMsg="No recent orders." showDateType="order" />

            <OrderTable orders={deliveredOrders} title="✅ Recently Delivered" emptyMsg="No delivered orders yet." showDateType="updated" />

        </div>
    );

    const OrderDetailsDialog = () => (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                {selectedOrder && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Order #{selectedOrder.orderNumber}</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Client Details</h4>
                                <div className="text-lg font-medium">{selectedOrder.clientName}</div>
                                <div className="text-muted-foreground">{selectedOrder.phone || "No phone"}</div>
                            </div>
                            <div className="text-right">
                                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Dates</h4>
                                <div><span className="font-medium">Ordered:</span> {format(parseISO(selectedOrder.orderDate), 'dd-MM-yyyy')}</div>
                                {selectedOrder.dueDate && <div><span className="font-medium">Due:</span> {format(parseISO(selectedOrder.dueDate), 'dd-MM-yyyy')}</div>}
                            </div>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground font-semibold uppercase">Work Status</span>
                                <Badge variant="outline" className={`mt-1 w-fit ${selectedOrder.workStatus === 'Ready' ? 'bg-green-100 text-green-800' :
                                        selectedOrder.workStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''
                                    }`}>
                                    {selectedOrder.workStatus}
                                </Badge>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground font-semibold uppercase">Delivery</span>
                                <Badge variant="outline" className={`mt-1 w-fit ${selectedOrder.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-800' : ''
                                    }`}>
                                    {selectedOrder.deliveryStatus}
                                </Badge>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground font-semibold uppercase">Payment</span>
                                <Badge variant="outline" className={`mt-1 w-fit ${selectedOrder.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                                        selectedOrder.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {selectedOrder.paymentStatus}
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        <div className="py-4">
                            <h4 className="font-semibold mb-3">Item Details</h4>
                            <div className="border rounded-md divide-y">
                                {selectedOrder.items.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between p-3 text-sm">
                                        <div>
                                            <span className="font-medium">{item.description}</span>
                                            <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                                        </div>
                                        <div className="font-medium">₹{(item.price * item.quantity) - (item.discount || 0)}</div>
                                    </div>
                                ))}
                                <div className="flex justify-between p-3 bg-muted/50 font-bold">
                                    <span>Total Amount</span>
                                    <span>₹{Number(selectedOrder.totalAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="py-2">
                            <h4 className="font-semibold mb-3">Payment History</h4>
                            {selectedOrder.paymentHistory.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No payments recorded.</p>
                            ) : (
                                <div className="border rounded-md divide-y">
                                    {selectedOrder.paymentHistory.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between p-3 text-sm items-center">
                                            <div className="flex gap-3">
                                                <span className="text-muted-foreground">{format(parseISO(p.date), 'dd-MM-yyyy')}</span>
                                                <Badge variant="secondary" className="text-xs h-5">{p.mode}</Badge>
                                            </div>
                                            <span className="font-medium">₹{p.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t mt-2">
                            <div className="text-sm text-muted-foreground">
                                {selectedOrder.notes && (
                                    <>
                                        <span className="font-semibold text-foreground">Note:</span> {selectedOrder.notes}
                                    </>
                                )}
                            </div>
                            <div className="text-xl font-bold">
                                <span className="text-muted-foreground text-sm font-normal mr-2">Balance Due:</span>
                                <span className={Number(selectedOrder.balanceAmount) > 0 ? "text-red-600" : "text-green-600"}>
                                    ₹{Number(selectedOrder.balanceAmount).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );

    if (disableLayout) return <>{content}<OrderDetailsDialog /></>;

    return (
        <Layout>
            {content}
            <OrderDetailsDialog />
        </Layout>
    );
}
