import { Layout } from "@/components/layout/Layout";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parseISO, isBefore, startOfDay } from "date-fns";

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
    const deliveredOrders = store.orders.filter((o) => o.deliveryStatus === "Delivered");

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
                                    <TableRow key={order.id}>
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

            <OrderTable orders={pendingOrders} title="⏳ Pending Works" emptyMsg="No pending works." />

            <OrderTable orders={recentOrders} title="📝 Recently Taken Orders" emptyMsg="No recent orders." showDateType="order" />

            <OrderTable orders={deliveredOrders} title="✅ Recently Delivered" emptyMsg="No delivered orders yet." showDateType="updated" />

        </div>
    );

    if (disableLayout) return content;

    return (
        <Layout>
            {content}
        </Layout>
    );
}
