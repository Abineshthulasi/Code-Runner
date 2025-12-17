import { Layout } from "@/components/layout/Layout";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Building2 } from "lucide-react";

export default function Bank() {
  const store = useStore();
  const { toast } = useToast();

  const [fundAmount, setFundAmount] = useState("");
  const [fundDesc, setFundDesc] = useState("");
  const [fundMode, setFundMode] = useState<"Cash" | "Bank">("Bank");
  const [fundDate, setFundDate] = useState(new Date().toISOString().split('T')[0]);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDesc, setWithdrawDesc] = useState("");
  const [withdrawMode, setWithdrawMode] = useState<"Cash" | "Bank">("Bank");
  const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddFunds = () => {
    if (!fundAmount) return;
    store.addTransaction({
      type: 'Deposit',
      amount: Number(fundAmount),
      description: fundDesc || 'Deposit',
      mode: fundMode,
      date: fundDate
    });
    setFundAmount("");
    setFundDesc("");
    setFundDate(new Date().toISOString().split('T')[0]);
    toast({ title: "Success", description: "Funds added." });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount) return;
    store.addTransaction({
      type: 'Withdraw',
      amount: Number(withdrawAmount),
      description: withdrawDesc || 'Withdrawal',
      mode: withdrawMode,
      date: withdrawDate
    });
    setWithdrawAmount("");
    setWithdrawDesc("");
    setWithdrawDate(new Date().toISOString().split('T')[0]);
    toast({ title: "Success", description: "Funds withdrawn." });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bank & Funds</h2>
          <p className="text-muted-foreground">Manage your liquidity and bank accounts.</p>
        </div>

        {/* Bank Balance Card */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Bank Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-tighter">
              ₹{store.bankBalance.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Cash In Hand: ₹{store.cashInHand.toLocaleString()}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Funds */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={fundDate}
                    onChange={(e) => setFundDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Account</label>
                  <Select value={fundMode} onValueChange={(v: any) => setFundMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank">Bank Account</SelectItem>
                      <SelectItem value="Cash">Cash in Hand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  placeholder="Enter amount"
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  placeholder="e.g., Sales revenue"
                  value={fundDesc}
                  onChange={(e) => setFundDesc(e.target.value)}
                />
              </div>
              <Button onClick={handleAddFunds} className="w-full bg-primary hover:bg-primary/90">Add</Button>
            </CardContent>
          </Card>

          {/* Withdraw */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Minus className="w-5 h-5" /> Withdraw Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={withdrawDate}
                    onChange={(e) => setWithdrawDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source Account</label>
                  <Select value={withdrawMode} onValueChange={(v: any) => setWithdrawMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank">Bank Account</SelectItem>
                      <SelectItem value="Cash">Cash in Hand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  placeholder="Enter amount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  placeholder="e.g., Expense payment"
                  value={withdrawDesc}
                  onChange={(e) => setWithdrawDesc(e.target.value)}
                />
              </div>
              <Button onClick={handleWithdraw} variant="outline" className="w-full">Enter</Button>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionTable transactions={store.transactions} onDelete={(id, type, amount, mode) => store.deleteTransaction(id, type, amount, mode)} onEdit={(id, desc) => store.updateTransaction(id, { description: desc })} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function TransactionTable({ transactions, onDelete, onEdit }: {
  transactions: any[],
  onDelete: (id: string, type: string, amount: number, mode: string) => void,
  onEdit: (id: string, desc: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");

  const startEdit = (tx: any) => {
    setEditingId(tx.id);
    setEditDesc(tx.description);
  };

  const saveEdit = () => {
    if (editingId) {
      onEdit(editingId, editDesc);
      setEditingId(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DATE</TableHead>
            <TableHead>DESCRIPTION</TableHead>
            <TableHead>MODE</TableHead>
            <TableHead>TYPE</TableHead>
            <TableHead className="text-right">AMOUNT</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No transactions yet
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell>{tx.mode}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tx.type === 'Deposit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {tx.type}
                  </span>
                </TableCell>
                <TableCell className={`text-right font-medium ${tx.type === 'Deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {tx.type === 'Deposit' ? '+' : '-'}₹{tx.amount}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startEdit(tx)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50" onClick={() => {
                      if (confirm('Are you sure you want to delete this transaction?')) {
                        onDelete(tx.id, tx.type, tx.amount, tx.mode);
                      }
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
