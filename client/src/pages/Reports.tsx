import { Layout } from "@/components/layout/Layout";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, IndianRupee, Clock, Pencil, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = ["2024", "2025", "2026"];

interface MonthlyData {
  month: string;
  monthIndex: number;
  year: number;
  sales: number;
  expenses: number;
  deposits: number;
  withdrawals: number;
  openingBank: number;
  closingBank: number;
  openingCash: number;
  closingCash: number;
  pending: number; // New: Pending amount for orders of this month
  prevMonthRecovery: number; // New: Amount collected this month for prev month orders
  totalSales: number; // New: Total worth of orders created in this month
  salesCash: number;
  salesBank: number;

  expensesCash: number;
  expensesBank: number;
  depositsCash: number;
  depositsBank: number;
  withdrawalsCash: number;
  withdrawalsBank: number;
}

// Helper for consistent local date parsing (YYYY-MM-DD -> Local Midnight)
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

export default function Reports() {
  const store = useStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const monthlyReport = useMemo(() => {
    const report: MonthlyData[] = [];

    // Get all transactions sorted by date
    const allTransactions: Array<{
      date: string;
      type: 'sale' | 'expense' | 'deposit' | 'withdraw';
      amount: number;
      mode: string;
    }> = [];

    // Add order payments as sales
    store.orders.forEach(order => {
      order.paymentHistory.forEach(payment => {
        allTransactions.push({
          date: payment.date,
          type: 'sale',
          amount: Number(payment.amount),
          mode: payment.mode,
        });
      });
    });

    // Add expenses
    store.expenses.forEach(expense => {
      allTransactions.push({
        date: expense.date,
        type: 'expense',
        amount: Number(expense.amount),
        mode: expense.mode,
      });
    });

    // Add bank transactions
    store.transactions.forEach(tx => {
      allTransactions.push({
        date: tx.date,
        type: tx.type === 'Deposit' ? 'deposit' : 'withdraw',
        amount: Number(tx.amount),
        mode: tx.mode,
      });
    });



    // Sort by date sort is vital for running balance
    allTransactions.sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

    // Calculate opening balances for the selected year (global history)
    const selectedYearInt = parseInt(selectedYear);
    const startOfSelectedYear = new Date(selectedYearInt, 0, 1);
    const firstTxDate = allTransactions.length > 0 ? parseLocalDate(allTransactions[0].date) : new Date();

    // Also check first order date, as there might be unpaid orders before any payment
    const sortedOrders = [...store.orders].sort((a, b) => parseLocalDate(a.orderDate || a.createdAt).getTime() - parseLocalDate(b.orderDate || b.createdAt).getTime());
    const firstOrderDate = sortedOrders.length > 0 ? parseLocalDate(sortedOrders[0].orderDate || sortedOrders[0].createdAt) : new Date();

    // Earliest activity is min(firstTx, firstOrder)
    const firstActivityDate = firstTxDate < firstOrderDate ? firstTxDate : firstOrderDate;

    const currentDate = new Date();

    let yearOpeningBank = 0;
    let yearOpeningCash = 0;

    // Calculate opening balance at start of year
    allTransactions.forEach(tx => {
      const txDate = parseLocalDate(tx.date);
      if (txDate < startOfSelectedYear) {
        const amount = tx.amount;
        const isCash = tx.mode.toLowerCase() === 'cash';

        if (tx.type === 'sale' || tx.type === 'deposit') {
          if (isCash) yearOpeningCash += amount;
          else yearOpeningBank += amount;
        } else if (tx.type === 'expense' || tx.type === 'withdraw') {
          if (isCash) yearOpeningCash -= amount;
          else yearOpeningBank -= amount;
        }
      }
    });

    let currentBank = yearOpeningBank;
    let currentCash = yearOpeningCash;

    // Iterate through each month of the selected year
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const thisMonthDate = new Date(selectedYearInt, monthIndex, 1);

      let monthlySales = 0;
      let monthlyExpenses = 0;
      let monthlyDeposits = 0;
      let monthlyWithdrawals = 0;
      let monthlySalesCash = 0;
      let monthlySalesBank = 0;
      let monthlyExpensesCash = 0;
      let monthlyExpensesBank = 0;
      let monthlyDepositsCash = 0;
      let monthlyDepositsBank = 0;
      let monthlyWithdrawalsCash = 0;
      let monthlyWithdrawalsBank = 0;

      const monthOpeningBank = currentBank;
      const monthOpeningCash = currentCash;

      // Process transactions for this month
      allTransactions.forEach(tx => {
        const txDate = parseLocalDate(tx.date);
        if (txDate.getFullYear() === selectedYearInt && txDate.getMonth() === monthIndex) {
          const amount = tx.amount;
          const isCash = tx.mode.toLowerCase() === 'cash';

          if (tx.type === 'sale') {
            monthlySales += amount;
            if (isCash) {
              currentCash += amount;
              monthlySalesCash += amount;
            } else {
              currentBank += amount;
              monthlySalesBank += amount;
            }
          } else if (tx.type === 'expense') {
            monthlyExpenses += amount;
            if (isCash) {
              currentCash -= amount;
              monthlyExpensesCash += amount;
            } else {
              currentBank -= amount;
              monthlyExpensesBank += amount;
            }
          } else if (tx.type === 'deposit') {
            monthlyDeposits += amount;
            if (isCash) {
              currentCash += amount;
              monthlyDepositsCash += amount;
            } else {
              currentBank += amount;
              monthlyDepositsBank += amount;
            }
          } else if (tx.type === 'withdraw') {
            monthlyWithdrawals += amount;
            if (isCash) {
              currentCash -= amount;
              monthlyWithdrawalsCash += amount;
            } else {
              currentBank -= amount;
              monthlyWithdrawalsBank += amount;
            }
          }
        }
      });

      // Calculate Special Metrics (Pending & Recovery)
      let monthlyPending = 0;
      let monthlyPrevMonthRecovery = 0;

      // 1. Pending Amount: Orders created in this month
      const monthlyOrders = store.orders.filter(o => {
        const d = parseLocalDate(o.orderDate || o.createdAt);
        return d.getFullYear() === selectedYearInt && d.getMonth() === monthIndex;
      });

      const totalOrderValue = monthlyOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      let collectedForThisMonthOrdersInThisMonth = 0;

      monthlyOrders.forEach(order => {
        order.paymentHistory.forEach(payment => {
          const pDate = parseLocalDate(payment.date);
          if (pDate.getFullYear() === selectedYearInt && pDate.getMonth() === monthIndex) {
            collectedForThisMonthOrdersInThisMonth += Number(payment.amount);
          }
        });
      });

      monthlyPending = totalOrderValue - collectedForThisMonthOrdersInThisMonth;
      monthlyPending = Math.max(0, monthlyPending);

      // 2. Prev Month Recovery: Payments received in this month for orders from prev month
      store.orders.forEach(order => {
        const oDate = parseLocalDate(order.orderDate || order.createdAt);

        // Check if payment is in this month
        order.paymentHistory.forEach(payment => {
          const pDate = parseLocalDate(payment.date);
          if (pDate.getFullYear() === selectedYearInt && pDate.getMonth() === monthIndex) {
            // Payment matches this month. Check if order is from ANY previous month (Arrears).
            const startOfReportMonth = new Date(selectedYearInt, monthIndex, 1);
            if (oDate < startOfReportMonth) {
              monthlyPrevMonthRecovery += Number(payment.amount);
            }
          }
        });
      });


      // Visibility Check
      const isFuture = thisMonthDate > currentDate;
      const isBeforeStart = thisMonthDate < new Date(firstActivityDate.getFullYear(), firstActivityDate.getMonth(), 1);

      const hasActivity = monthlySales > 0 || monthlyExpenses > 0 || monthlyDeposits > 0 || monthlyWithdrawals > 0 || monthlyPending > 0 || monthlyPrevMonthRecovery > 0 || monthlyOrders.length > 0;

      if (!isFuture && (!isBeforeStart || hasActivity)) {
        report.push({
          month: MONTHS[monthIndex],
          monthIndex,
          year: selectedYearInt,
          sales: monthlySales,
          expenses: monthlyExpenses,
          deposits: monthlyDeposits,
          withdrawals: monthlyWithdrawals,
          openingBank: monthOpeningBank,
          closingBank: currentBank,
          openingCash: monthOpeningCash,
          closingCash: currentCash,
          pending: monthlyPending,
          prevMonthRecovery: monthlyPrevMonthRecovery,
          totalSales: totalOrderValue,
          salesCash: monthlySalesCash,
          salesBank: monthlySalesBank,
          expensesCash: monthlyExpensesCash,
          expensesBank: monthlyExpensesBank,
          depositsCash: monthlyDepositsCash,
          depositsBank: monthlyDepositsBank,
          withdrawalsCash: monthlyWithdrawalsCash,
          withdrawalsBank: monthlyWithdrawalsBank
        });
      }
    }

    return report;
  }, [store.orders, store.expenses, store.transactions, selectedYear]);

  // Calculate totals for the year
  const yearTotals = useMemo(() => {
    return monthlyReport.reduce((acc, month) => ({
      sales: acc.sales + month.sales,
      expenses: acc.expenses + month.expenses,
      deposits: acc.deposits + month.deposits,
      withdrawals: acc.withdrawals + month.withdrawals,
      pending: acc.pending + month.pending,
      prevMonthRecovery: acc.prevMonthRecovery + month.prevMonthRecovery,
      totalSales: acc.totalSales + month.totalSales
    }), { sales: 0, expenses: 0, deposits: 0, withdrawals: 0, pending: 0, prevMonthRecovery: 0, totalSales: 0 });
  }, [monthlyReport]);

  // Calculate Current Outstanding for the selected year (Live status)
  const currentYearPending = useMemo(() => {
    const selectedYearInt = parseInt(selectedYear);
    return store.orders
      .filter(o => {
        const d = parseLocalDate(o.orderDate || o.createdAt);
        return d.getFullYear() === selectedYearInt;
      })
      .reduce((sum, o) => sum + Number(o.balanceAmount), 0);
  }, [store.orders, selectedYear]);

  // Calculate Today's Payment
  const todaysPayment = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return store.orders.reduce((sum, order) => {
      const orderPayments = order.paymentHistory.filter(p => p.date === today);
      return sum + orderPayments.reduce((pSum, p) => pSum + Number(p.amount), 0);
    }, 0);
  }, [store.orders]);

  // Daily Report Logic
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [dailyReportDate, setDailyReportDate] = useState(new Date().toISOString().split('T')[0]);

  const dailyStats = useMemo(() => {
    const date = dailyReportDate;
    let salesReceived = 0;
    let expenses = 0;
    let cashAdded = 0; // Cash Sales + Cash Deposits
    let bankAdded = 0; // Bank Sales + Bank Deposits

    const salesList: any[] = [];
    const expensesList: any[] = [];
    const depositsList: any[] = [];

    // 1. Sales Received (from Orders)
    store.orders.forEach(order => {
      order.paymentHistory.forEach(p => {
        if (p.date === date) {
          const amt = Number(p.amount);
          salesReceived += amt;
          if (p.mode === 'Cash') cashAdded += amt;
          else bankAdded += amt;

          salesList.push({
            id: order.id + '_' + p.date,
            desc: order.clientName || `Order #${order.id}`,
            amount: amt,
            mode: p.mode
          });
        }
      });
    });

    // 2. Expenses
    store.expenses.forEach(e => {
      if (e.date === date) {
        expenses += Number(e.amount);
        expensesList.push({
          id: e.id,
          desc: e.description,
          amount: Number(e.amount),
          mode: e.mode
        });
      }
    });

    // 3. Deposits (Add Funds)
    store.transactions.forEach(t => {
      if (t.date === date && t.type === 'Deposit') {
        const amt = Number(t.amount);
        if (t.mode === 'Cash') cashAdded += amt;
        else bankAdded += amt;

        depositsList.push({
          id: t.id,
          desc: t.description || 'Deposit',
          amount: amt,
          mode: t.mode
        });
      }
    });

    return {
      salesReceived, expenses, cashAdded, bankAdded,
      salesList, expensesList, depositsList
    };
  }, [dailyReportDate, store.orders, store.expenses, store.transactions]);

  // Balance Adjustment Logic
  const [adjustingData, setAdjustingData] = useState<{
    monthIndex: number;
    year: number;
    type: 'Bank' | 'Cash';
    currentBalance: number;
  } | null>(null);
  const [newBalance, setNewBalance] = useState("");

  const handleAdjustBalance = async () => {
    if (!adjustingData || !newBalance) return;

    const diff = Number(newBalance) - adjustingData.currentBalance;
    if (diff === 0) {
      setAdjustingData(null);
      return;
    }

    // Create adjustment transaction
    // Date should be end of that month
    const year = adjustingData.year;
    const month = adjustingData.monthIndex;
    const adjustmentDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const type = diff > 0 ? 'Deposit' : 'Withdraw';
    const amount = Math.abs(diff);

    await store.addTransaction({
      description: `Balance Adjustment (${MONTHS[month]})`,
      amount: amount,
      type: type,
      mode: adjustingData.type,
      date: adjustmentDate
    });

    setAdjustingData(null);
    setNewBalance("");
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Monthly Reports</h2>
            <p className="text-muted-foreground">View financial summaries by month</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDailyReport(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Daily Summary
            </Button>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ... (Rest of existing JSX) ... */}

        {/* Year Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Payment</CardTitle>
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">₹{todaysPayment.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales ({selectedYear})</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{yearTotals.totalSales.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales Recv ({selectedYear})</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{yearTotals.sales.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses ({selectedYear})</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{yearTotals.expenses.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net P&L ({selectedYear})</CardTitle>
              {(yearTotals.totalSales - yearTotals.expenses) >= 0 ?
                <TrendingUp className="h-4 w-4 text-green-600" /> :
                <TrendingDown className="h-4 w-4 text-red-600" />
              }
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(yearTotals.totalSales - yearTotals.expenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(yearTotals.totalSales - yearTotals.expenses) >= 0 ? '+' : ''}₹{(yearTotals.totalSales - yearTotals.expenses).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Received P&L ({selectedYear})</CardTitle>
              {(yearTotals.sales - yearTotals.expenses) >= 0 ?
                <TrendingUp className="h-4 w-4 text-green-600" /> :
                <TrendingDown className="h-4 w-4 text-red-600" />
              }
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(yearTotals.sales - yearTotals.expenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(yearTotals.sales - yearTotals.expenses) >= 0 ? '+' : ''}₹{(yearTotals.sales - yearTotals.expenses).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending ({selectedYear})</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">₹{currentYearPending.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Bank Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{store.bankBalance.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash In Hand</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{store.cashInHand.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Sales & Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales & Expenses by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total Order Worth</TableHead>
                    <TableHead className="text-right">Recv. (Current)</TableHead>
                    <TableHead className="text-right">Recv. (Past)</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Pending (Orders)</TableHead>
                    <TableHead className="text-right">Net Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyReport.map((data) => {
                    const netProfit = data.totalSales - data.expenses;
                    const hasData = data.sales > 0 || data.expenses > 0;

                    return (
                      <TableRow key={data.month} className={!hasData ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{data.month}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{data.totalSales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ₹{data.sales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          ₹{data.prevMonthRecovery.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ₹{data.expenses.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          ₹{data.pending.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total ({selectedYear})</TableCell>
                    <TableCell className="text-right font-bold">₹{yearTotals.totalSales.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">₹{yearTotals.sales.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-blue-600">₹{yearTotals.prevMonthRecovery.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-600">₹{yearTotals.expenses.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-amber-600">₹{yearTotals.pending.toLocaleString()}</TableCell>
                    <TableCell className={`text-right ${yearTotals.totalSales - yearTotals.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {yearTotals.totalSales - yearTotals.expenses >= 0 ? '+' : ''}₹{(yearTotals.totalSales - yearTotals.expenses).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Bank & Cash Balance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bank & Cash Balance by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right border-l">Open (Bank)</TableHead>

                    <TableHead className="text-right font-bold bg-slate-50 border-r">Close (Bank)</TableHead>

                    <TableHead className="text-right">Open (Cash)</TableHead>

                    <TableHead className="text-right font-bold bg-slate-50">Close (Cash)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyReport.map((data) => (
                    <TableRow key={data.month}>
                      <TableCell className="font-medium">{data.month}</TableCell>

                      {/* Bank Balance Section */}
                      <TableCell className="text-right border-l">₹{data.openingBank.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold bg-slate-50 border-r">
                        <div className="flex items-center justify-end gap-2">
                          ₹{data.closingBank.toLocaleString()}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-50 hover:opacity-100"
                            onClick={() => {
                              setAdjustingData({
                                monthIndex: data.monthIndex,
                                year: data.year,
                                type: 'Bank',
                                currentBalance: data.closingBank
                              });
                              setNewBalance(data.closingBank.toString());
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Cash Balance Section */}
                      <TableCell className="text-right">₹{data.openingCash.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold bg-slate-50">
                        <div className="flex items-center justify-end gap-2">
                          ₹{data.closingCash.toLocaleString()}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-50 hover:opacity-100"
                            onClick={() => {
                              setAdjustingData({
                                monthIndex: data.monthIndex,
                                year: data.year,
                                type: 'Cash',
                                currentBalance: data.closingCash
                              });
                              setNewBalance(data.closingCash.toString());
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Transaction Breakdown - New Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Monthly Transaction Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right text-green-600 border-l">Sales (Bank)</TableHead>
                    <TableHead className="text-right text-green-600">Add Fund (Bank)</TableHead>
                    <TableHead className="text-right text-red-600">Exp. (Bank)</TableHead>
                    <TableHead className="text-right text-red-600 border-r">Withd. (Bank)</TableHead>

                    <TableHead className="text-right text-green-600">Sales (Cash)</TableHead>
                    <TableHead className="text-right text-green-600">Add Fund (Cash)</TableHead>
                    <TableHead className="text-right text-red-600">Exp. (Cash)</TableHead>
                    <TableHead className="text-right text-red-600">Withd. (Cash)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyReport.map((data) => (
                    <TableRow key={data.month}>
                      <TableCell className="font-medium">{data.month}</TableCell>

                      {/* Bank Transactions */}
                      <TableCell className="text-right text-green-600 border-l">+₹{data.salesBank.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">+₹{data.depositsBank.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">-₹{data.expensesBank.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600 border-r">-₹{data.withdrawalsBank.toLocaleString()}</TableCell>

                      {/* Cash Transactions */}
                      <TableCell className="text-right text-green-600">+₹{data.salesCash.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">+₹{data.depositsCash.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">-₹{data.expensesCash.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">-₹{data.withdrawalsCash.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!adjustingData} onOpenChange={(open) => !open && setAdjustingData(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust {adjustingData?.type} Balance</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Adjusting the balance will create a transaction to correct the ending balance for {adjustingData ? MONTHS[adjustingData.monthIndex] : ''}.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Closing Balance</label>
              <Input
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustingData(null)}>Cancel</Button>
            <Button onClick={handleAdjustBalance}>Confirm Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Daily Report Dialog */}
      <Dialog open={showDailyReport} onOpenChange={setShowDailyReport}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daily Financial Summary</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium whitespace-nowrap">Select Date:</label>
              <Input
                type="date"
                value={dailyReportDate}
                onChange={(e) => setDailyReportDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* 1. Sales List */}
            <div>
              <h3 className="font-semibold text-lg flex justify-between">
                Sales Received
                <span className="text-green-600">₹{dailyStats.salesReceived.toLocaleString()}</span>
              </h3>
              <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2">Client/Order</TableHead>
                      <TableHead className="py-2">Mode</TableHead>
                      <TableHead className="text-right py-2">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyStats.salesList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-2">No sales today</TableCell>
                      </TableRow>
                    ) : (
                      dailyStats.salesList.map((item, i) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-2">{item.desc}</TableCell>
                          <TableCell className="py-2">{item.mode}</TableCell>
                          <TableCell className="text-right py-2">₹{item.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* 2. Deposits List */}
            <div>
              <h3 className="font-semibold text-lg flex justify-between">
                Added Funds (Deposits)
                <span className="text-green-600">₹{dailyStats.depositsList.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</span>
              </h3>
              <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2">Description</TableHead>
                      <TableHead className="py-2">Mode</TableHead>
                      <TableHead className="text-right py-2">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyStats.depositsList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-2">No deposits today</TableCell>
                      </TableRow>
                    ) : (
                      dailyStats.depositsList.map((item, i) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-2">{item.desc}</TableCell>
                          <TableCell className="py-2">{item.mode}</TableCell>
                          <TableCell className="text-right py-2">₹{item.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* 3. Expenses List */}
            <div>
              <h3 className="font-semibold text-lg flex justify-between">
                Expenses
                <span className="text-red-600">₹{dailyStats.expenses.toLocaleString()}</span>
              </h3>
              <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2">Description</TableHead>
                      <TableHead className="py-2">Mode</TableHead>
                      <TableHead className="text-right py-2">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyStats.expensesList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-2">No expenses today</TableCell>
                      </TableRow>
                    ) : (
                      dailyStats.expensesList.map((item, i) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-2">{item.desc}</TableCell>
                          <TableCell className="py-2">{item.mode}</TableCell>
                          <TableCell className="text-right py-2">₹{item.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <span className="text-sm font-medium">Total Cash Flow:</span>
                <div className="text-xl font-bold">
                  <span className="text-green-600">+₹{dailyStats.cashAdded.toLocaleString()}</span> / <span className="text-red-600">-₹{dailyStats.expensesList.filter(e => e.mode === 'Cash').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Total Bank Flow:</span>
                <div className="text-xl font-bold">
                  <span className="text-green-600">+₹{dailyStats.bankAdded.toLocaleString()}</span> / <span className="text-red-600">-₹{dailyStats.expensesList.filter(e => e.mode !== 'Cash').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button onClick={() => setShowDailyReport(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

