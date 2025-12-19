import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import {
  Wallet,
  TrendingUp,
  Receipt,
  Clock,
  Plus,
  Minus,
  IndianRupee,
  Pencil
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const store = useStore();
  const { toast } = useToast();
  const { user } = useAuth();

  // Local state for quick actions
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMode, setDepositMode] = useState<"Cash" | "Bank">("Cash");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMode, setWithdrawMode] = useState<"Cash" | "Bank">("Cash");

  // Edit Balance state
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);
  const [editBankBalance, setEditBankBalance] = useState("");
  const [editCashInHand, setEditCashInHand] = useState("");

  const handleEditBalanceOpen = () => {
    setEditBankBalance(store.bankBalance.toString());
    setEditCashInHand(store.cashInHand.toString());
    setIsEditBalanceOpen(true);
  };

  const handleSaveBalance = async () => {
    await store.updateBalances({
      bankBalance: editBankBalance,
      cashInHand: editCashInHand
    });
    setIsEditBalanceOpen(false);
    toast({ title: "Balances Updated", description: "Bank balance and Cash in Hand updated successfully." });
  };

  const handleDeposit = () => {
    if (!depositAmount || isNaN(Number(depositAmount))) return;
    store.addTransaction({
      type: 'Deposit',
      amount: Number(depositAmount),
      description: 'Quick Deposit via Dashboard',
      mode: depositMode,
      date: new Date().toISOString().split('T')[0]
    });
    setDepositAmount("");
    toast({ title: "Funds Added", description: `₹${depositAmount} added to ${depositMode}.` });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return;
    store.addTransaction({
      type: 'Withdraw',
      amount: Number(withdrawAmount),
      description: 'Quick Withdraw via Dashboard',
      mode: withdrawMode,
      date: new Date().toISOString().split('T')[0]
    });
    setWithdrawAmount("");
    toast({ title: "Funds Withdrawn", description: `₹${withdrawAmount} withdrawn from ${withdrawMode}.` });
  };

  const pendingOrders = store.getPendingOrdersCount();
  const totalSales = store.getTotalSales();
  const totalExpenses = store.getTotalExpenses();

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back to Bobiz Designer Studio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bank Balance</CardTitle>
              <div className="flex gap-2">
                {user?.role === 'admin' && (
                  <Button variant="ghost" size="icon" className="h-4 w-4" onClick={handleEditBalanceOpen}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{store.bankBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Available funds</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Collected payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Recorded expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders in progress</p>
              <p className="text-xs font-medium text-amber-600 mt-2">
                Pending: ₹{store.getPendingSalesAmount().toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="md:col-span-1 lg:col-span-1 border-dashed bg-sidebar/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Cash In Hand</CardTitle>
                {user?.role === 'admin' && (
                  <Button variant="ghost" size="icon" className="h-4 w-4 -mr-2" onClick={handleEditBalanceOpen}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-muted-foreground" />
                {store.cashInHand.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Physical cash available</p>
            </CardContent>
          </Card>
        </div>


        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Deposit */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-green-600">
              <Plus className="w-5 h-5" /> Amount Deposit
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={depositMode === 'Cash' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDepositMode('Cash')}
                  className={depositMode === 'Cash' ? 'bg-green-600 hover:bg-green-700' : ''}
                >Cash</Button>
                <Button
                  variant={depositMode === 'Bank' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDepositMode('Bank')}
                  className={depositMode === 'Bank' ? 'bg-green-600 hover:bg-green-700' : ''}
                >Bank</Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type Amount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                <Button onClick={handleDeposit} className="bg-green-600 hover:bg-green-700">
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Adding to: {depositMode === 'Cash' ? 'Cash in Hand' : 'Bank Balance'}</p>
            </div>
          </div>

          {/* Withdraw */}
          {user?.role === 'admin' && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-red-600">
                <Minus className="w-5 h-5" /> Withdraw Amount
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant={withdrawMode === 'Cash' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWithdrawMode('Cash')}
                    className={withdrawMode === 'Cash' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >Cash</Button>
                  <Button
                    variant={withdrawMode === 'Bank' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWithdrawMode('Bank')}
                    className={withdrawMode === 'Bank' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >Bank</Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type Amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <Button onClick={handleWithdraw} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    Enter
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Withdrawing from: {withdrawMode === 'Cash' ? 'Cash in Hand' : 'Bank Balance'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Lists */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="link" className="text-xs text-muted-foreground" asChild>
                <a href="/orders">View All</a>
              </Button>
            </CardHeader>
            <CardContent>
              {store.orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No orders yet</div>
              ) : (
                <div className="space-y-4">
                  {store.orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                      <div>
                        <div className="font-medium text-sm">{order.clientName}</div>
                        <div className="text-xs text-muted-foreground">{order.orderNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">₹{order.totalAmount}</div>
                        <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${order.workStatus === 'Ready' ? 'bg-green-100 text-green-800' :
                          order.workStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {order.workStatus}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Expenses</CardTitle>
              <Button variant="link" className="text-xs text-muted-foreground" asChild>
                <a href="/expenses">View All</a>
              </Button>
            </CardHeader>
            <CardContent>
              {store.expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No expenses yet</div>
              ) : (
                <div className="space-y-4">
                  {store.expenses.slice(0, 5).map(expense => (
                    <div key={expense.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                      <div>
                        <div className="font-medium text-sm">{expense.category}</div>
                        <div className="text-xs text-muted-foreground">{expense.description}</div>
                      </div>
                      <div className="font-semibold text-sm">₹{expense.amount}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


      <Dialog open={isEditBalanceOpen} onOpenChange={setIsEditBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Balances</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bank Balance</Label>
              <Input
                value={editBankBalance}
                onChange={(e) => setEditBankBalance(e.target.value)}
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Cash In Hand</Label>
              <Input
                value={editCashInHand}
                onChange={(e) => setEditCashInHand(e.target.value)}
                type="number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditBalanceOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBalance}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout >
  );
}
