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
import { TrendingUp, TrendingDown, Wallet, IndianRupee } from "lucide-react";

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
}

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

    // Sort by date
    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Initialize running balances
    let runningBank = 25000; // Initial bank balance
    let runningCash = 5000;  // Initial cash in hand

    // Calculate monthly data
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const year = parseInt(selectedYear);
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0);

      const openingBank = runningBank;
      const openingCash = runningCash;

      let monthlySales = 0;
      let monthlyExpenses = 0;
      let monthlyDeposits = 0;
      let monthlyWithdrawals = 0;

      allTransactions.forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate >= monthStart && txDate <= monthEnd) {
          switch (tx.type) {
            case 'sale':
              monthlySales += tx.amount;
              if (tx.mode === 'Cash') {
                runningCash += tx.amount;
              } else {
                runningBank += tx.amount;
              }
              break;
            case 'expense':
              monthlyExpenses += tx.amount;
              if (tx.mode === 'Cash') {
                runningCash -= tx.amount;
              } else {
                runningBank -= tx.amount;
              }
              break;
            case 'deposit':
              monthlyDeposits += tx.amount;
              if (tx.mode === 'Cash') {
                runningCash += tx.amount;
              } else {
                runningBank += tx.amount;
              }
              break;
            case 'withdraw':
              monthlyWithdrawals += tx.amount;
              if (tx.mode === 'Cash') {
                runningCash -= tx.amount;
              } else {
                runningBank -= tx.amount;
              }
              break;
          }
        }
      });

      report.push({
        month: MONTHS[monthIndex],
        monthIndex,
        year,
        sales: monthlySales,
        expenses: monthlyExpenses,
        deposits: monthlyDeposits,
        withdrawals: monthlyWithdrawals,
        openingBank,
        closingBank: runningBank,
        openingCash,
        closingCash: runningCash,
      });
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
    }), { sales: 0, expenses: 0, deposits: 0, withdrawals: 0 });
  }, [monthlyReport]);

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

        {/* Year Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales ({selectedYear})</CardTitle>
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
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyReport.map((data) => {
                    const netProfit = data.sales - data.expenses;
                    const hasData = data.sales > 0 || data.expenses > 0;

                    return (
                      <TableRow key={data.month} className={!hasData ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{data.month}</TableCell>
                        <TableCell className="text-right text-green-600">
                          ₹{data.sales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          ₹{data.expenses.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total ({selectedYear})</TableCell>
                    <TableCell className="text-right text-green-600">₹{yearTotals.sales.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-600">₹{yearTotals.expenses.toLocaleString()}</TableCell>
                    <TableCell className={`text-right ${yearTotals.sales - yearTotals.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {yearTotals.sales - yearTotals.expenses >= 0 ? '+' : ''}₹{(yearTotals.sales - yearTotals.expenses).toLocaleString()}
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
                    <TableHead className="text-right">Opening Bank</TableHead>
                    <TableHead className="text-right">Closing Bank</TableHead>
                    <TableHead className="text-right">Opening Cash</TableHead>
                    <TableHead className="text-right">Closing Cash</TableHead>
                    <TableHead className="text-right">Deposits</TableHead>
                    <TableHead className="text-right">Withdrawals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyReport.map((data) => (
                    <TableRow key={data.month}>
                      <TableCell className="font-medium">{data.month}</TableCell>
                      <TableCell className="text-right">₹{data.openingBank.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">
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
                      <TableCell className="text-right">₹{data.openingCash.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">
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
                      <TableCell className="text-right text-green-600">
                        {data.deposits > 0 ? `+₹${data.deposits.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {data.withdrawals > 0 ? `-₹${data.withdrawals.toLocaleString()}` : '-'}
                      </TableCell>
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
    </Layout>
  );
}
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
