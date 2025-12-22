import { Layout } from "@/components/layout/Layout";
import { useStore, Expense } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO } from "date-fns";

export default function Expenses() {
  const store = useStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Materials");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState<"Cash" | "UPI" | "Bank">("Cash");

  // Edit State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMode, setEditMode] = useState<"Cash" | "UPI" | "Bank">("Cash");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleAddExpense = () => {
    if (!description || !amount) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    store.addExpense({
      description,
      category,
      amount: Number(amount),
      date,
      mode
    });

    toast({ title: "Expense Added", description: "Expense logged successfully." });

    // Reset form
    setDescription("");
    setAmount("");
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setEditDescription(expense.description);
    setEditCategory(expense.category);
    setEditAmount(String(expense.amount));
    setEditDate(expense.date);
    setEditMode(expense.mode);
    setIsEditDialogOpen(true);
  };

  const handleUpdateExpense = () => {
    if (!editingExpense || !editDescription || !editAmount) return;

    store.updateExpense(editingExpense.id, {
      description: editDescription,
      category: editCategory,
      amount: Number(editAmount),
      date: editDate,
      mode: editMode
    });

    setIsEditDialogOpen(false);
    toast({ title: "Expense Updated" });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">Track your business spending.</p>
        </div>

        {/* Log New Expense Card */}
        <Card>
          <CardHeader>
            <CardTitle>Log New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., Fabric Purchase"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Materials">Materials/Inventory</SelectItem>
                      <SelectItem value="Rent">Rent/Utilities</SelectItem>
                      <SelectItem value="Salary">Staff Salary</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Mode of Payment</Label>
                <RadioGroup
                  defaultValue="Cash"
                  value={mode}
                  onValueChange={(val: "Cash" | "UPI" | "Bank") => setMode(val)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Cash" id="cash" />
                    <Label htmlFor="cash">Cash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UPI" id="upi" />
                    <Label htmlFor="upi">UPI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Bank" id="bank" />
                    <Label htmlFor="bank">Bank Transfer</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={handleAddExpense} className="w-full md:w-auto bg-primary hover:bg-primary/90">
                Add Entry
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expense History</CardTitle>
            <div className="text-sm font-medium text-muted-foreground">
              Total: <span className="text-foreground">₹{store.getTotalExpenses()}</span>
            </div>
          </CardHeader>
          <CardContent>
            {store.expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No expenses recorded</div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(
                  store.expenses.reduce((acc, expense) => {
                    const monthYear = format(parseISO(expense.date), 'MMMM yyyy');
                    if (!acc[monthYear]) acc[monthYear] = [];
                    acc[monthYear].push(expense);
                    return acc;
                  }, {} as Record<string, typeof store.expenses>)
                ).map(([month, expenses]) => {
                  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

                  return (
                    <AccordionItem key={month} value={month}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex justify-between w-full pr-4">
                          <span className="font-semibold">{month}</span>
                          <span className="text-muted-foreground">Total: ₹{monthlyTotal.toLocaleString()}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>DATE</TableHead>
                              <TableHead>CATEGORY</TableHead>
                              <TableHead>DETAILS</TableHead>
                              <TableHead>MODE</TableHead>
                              <TableHead className="text-right">AMOUNT</TableHead>
                              <TableHead className="text-right">ACTIONS</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expenses.map((expense) => (
                              <TableRow key={expense.id}>
                                <TableCell>{format(parseISO(expense.date), 'dd-MM-yyyy')}</TableCell>
                                <TableCell>{expense.category}</TableCell>
                                <TableCell>{expense.description}</TableCell>
                                <TableCell>{expense.mode}</TableCell>
                                <TableCell className="text-right font-medium">₹{expense.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => openEditDialog(expense)}
                                  >
                                    <span className="sr-only">Edit</span>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  {(user?.role === 'admin' || user?.role === 'manager') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive h-8 w-8 p-0"
                                      onClick={() => store.deleteExpense(expense.id)}
                                    >
                                      <span className="sr-only">Delete</span>
                                      &times;
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Edit Expense Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Materials">Materials/Inventory</SelectItem>
                      <SelectItem value="Rent">Rent/Utilities</SelectItem>
                      <SelectItem value="Salary">Staff Salary</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Mode of Payment</Label>
                <RadioGroup
                  value={editMode}
                  onValueChange={(val: "Cash" | "UPI" | "Bank") => setEditMode(val)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Cash" id="edit-cash" />
                    <Label htmlFor="edit-cash">Cash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UPI" id="edit-upi" />
                    <Label htmlFor="edit-upi">UPI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Bank" id="edit-bank" />
                    <Label htmlFor="edit-bank">Bank Transfer</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateExpense}>Update Expense</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
