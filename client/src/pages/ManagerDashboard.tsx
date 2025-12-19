import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import {
    TrendingUp,
    Receipt,
    ShoppingBag,
    Clock,
    Building2,
    Banknote
} from "lucide-react";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

import { StaffDashboard } from "./StaffDashboard";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManagerDashboard() {
    const [view, setView] = useState<'manager' | 'staff'>('manager');
    const store = useStore();
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Helper to check if date is in current month
    const isCurrentMonth = (dateStr: string) => {
        try {
            // Handle both ISO strings and YYYY-MM-DD
            const date = parseISO(dateStr);
            return isWithinInterval(date, { start: monthStart, end: monthEnd });
        } catch (e) {
            return false;
        }
    };

    // 1. Total Sales (Current Month) - Based on Total Order Value of orders created this month
    // OR is it based on payments? "Total Sales" usually implies booked revenue.
    const monthlyOrders = store.orders.filter(o => isCurrentMonth(o.orderDate || o.createdAt));
    const totalSales = monthlyOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // 2. Total Expenses (Current Month)
    const monthlyExpenses = store.expenses.filter(e => isCurrentMonth(e.date));
    const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // 3. Number of Orders (Current Month)
    const orderCount = monthlyOrders.length;

    // 4. Pending Amount to Receive (Global - Assumption: Manager needs to know total outstanding)
    const pendingAmount = store.getPendingSalesAmount();

    // 5. Sales Amount Received in Bank (Current Month)
    // 6. Sales Amount Received in Cash (Current Month)
    let receivedBank = 0;
    let receivedCash = 0;

    store.orders.forEach(order => {
        order.paymentHistory.forEach(payment => {
            if (isCurrentMonth(payment.date)) {
                if (payment.mode === 'Cash') {
                    receivedCash += Number(payment.amount);
                } else if (payment.mode === 'Bank' || payment.mode === 'UPI') {
                    receivedBank += Number(payment.amount);
                }
            }
        });
    });

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
                        <p className="text-muted-foreground mt-1">Overview for {now.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex bg-muted p-1 rounded-lg">
                        <Button
                            variant={view === 'manager' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setView('manager')}
                            className="bg-background text-foreground shadow-sm hover:bg-background/90"
                        >
                            Overview
                        </Button>
                        <Button
                            variant={view === 'staff' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setView('staff')}
                        >
                            Staff View
                        </Button>
                    </div>
                </div>

                {view === 'staff' ? (
                    <StaffDashboard disableLayout={true} />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Total Sales */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sales (Month)</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{totalSales.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">{orderCount} orders this month</p>
                            </CardContent>
                        </Card>

                        {/* Total Expenses */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Expenses (Month)</CardTitle>
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</div>
                            </CardContent>
                        </Card>

                        {/* Pending Amount */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Pending Due</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">₹{pendingAmount.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Total outstanding amount</p>
                            </CardContent>
                        </Card>

                        {/* Received in Bank */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Received in Bank (Month)</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">₹{receivedBank.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Includes UPI</p>
                            </CardContent>
                        </Card>

                        {/* Received in Cash */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Received in Cash (Month)</CardTitle>
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">₹{receivedCash.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </Layout>
    );
}
