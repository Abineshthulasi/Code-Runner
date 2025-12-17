import { create } from 'zustand';
import { api } from './api';

// Re-export types from API for compatibility
export type TransactionMode = 'Cash' | 'Bank' | 'UPI';
export type WorkStatus = 'Pending' | 'In Progress' | 'Ready' | 'Cancelled';
export type DeliveryStatus = 'Pending' | 'Delivered' | 'Returned' | 'Out for Delivery';
export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';

export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  mode: TransactionMode;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  phone: string;
  items: OrderItem[];
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  workStatus: WorkStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  paymentHistory: PaymentRecord[];
  orderDate: string;
  dueDate: string;
  createdAt: string;
  notes?: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  mode: TransactionMode;
}

export interface Transaction {
  id: string;
  type: 'Deposit' | 'Withdraw';
  amount: number;
  description: string;
  date: string;
  mode: TransactionMode;
}

interface StoreState {
  bankBalance: number;
  cashInHand: number;
  orders: Order[];
  expenses: Expense[];
  transactions: Transaction[];

  // Data Loading
  isLoading: boolean;
  loadData: () => Promise<void>;

  // Actions - these now sync with backend
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'paymentHistory' | 'workStatus' | 'deliveryStatus' | 'paymentStatus' | 'balanceAmount' | 'advanceAmount'> & { initialPayment?: number, initialPaymentMode?: TransactionMode }) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  addOrderPayment: (orderId: string, amount: number, mode: TransactionMode, date: string, note?: string) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string, type: string, amount: number, mode: string) => Promise<void>;

  // Computeds
  getTotalSales: () => number;
  getTotalExpenses: () => number;
  getPendingOrdersCount: () => number;
  getPendingSalesAmount: () => number;

  updateBalances: (updates: { bankBalance?: string; cashInHand?: string }) => Promise<void>;
}

// Helper to convert string amounts to numbers from API
const toNumber = (val: string | number): number => typeof val === 'string' ? parseFloat(val) : val;

export const useStore = create<StoreState>((set, get) => ({
  bankBalance: 0,
  cashInHand: 0,
  orders: [],
  expenses: [],
  transactions: [],
  isLoading: false,

  loadData: async () => {
    set({ isLoading: true });
    try {
      const [balances, orders, expenses, transactions] = await Promise.all([
        api.getBalances(),
        api.getOrders(),
        api.getExpenses(),
        api.getTransactions(),
      ]);

      set({
        bankBalance: toNumber(balances.bankBalance),
        cashInHand: toNumber(balances.cashInHand),
        orders: orders.map(o => ({
          ...o,
          totalAmount: toNumber(o.totalAmount),
          advanceAmount: toNumber(o.advanceAmount),
          balanceAmount: toNumber(o.balanceAmount),
          workStatus: o.workStatus as WorkStatus,
          deliveryStatus: o.deliveryStatus as DeliveryStatus,
          paymentStatus: o.paymentStatus as PaymentStatus,
        })) as Order[],
        expenses: expenses.map(e => ({
          ...e,
          amount: toNumber(e.amount),
          mode: e.mode as TransactionMode,
        })) as Expense[],
        transactions: transactions.map(t => ({
          ...t,
          amount: toNumber(t.amount),
          type: t.type as 'Deposit' | 'Withdraw',
          mode: t.mode as TransactionMode,
        })) as Transaction[],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      set({ isLoading: false });
    }
  },

  addOrder: async ({ initialPayment = 0, initialPaymentMode = 'Cash', ...orderData }) => {
    const paymentHistory: PaymentRecord[] = [];
    let balance = orderData.totalAmount;
    let pStatus: PaymentStatus = 'Unpaid';

    if (initialPayment > 0) {
      paymentHistory.push({
        id: crypto.randomUUID(),
        amount: initialPayment,
        date: orderData.orderDate,
        mode: initialPaymentMode,
        note: 'Advance Payment'
      });
      balance -= initialPayment;
      pStatus = balance <= 0 ? 'Paid' : 'Partial';
    }

    const newOrder = await api.createOrder({
      ...orderData,
      paymentHistory,
      advanceAmount: initialPayment.toString(),
      balanceAmount: balance.toString(),
      workStatus: 'Pending',
      deliveryStatus: 'Pending',
      paymentStatus: pStatus
    });

    // Update local balances
    const state = get();
    let newBank = state.bankBalance;
    let newCash = state.cashInHand;

    if (initialPayment > 0) {
      if (initialPaymentMode === 'Cash') {
        newCash += initialPayment;
      } else {
        newBank += initialPayment;
      }
      await api.updateBalances({
        bankBalance: newBank.toString(),
        cashInHand: newCash.toString(),
      });
    }

    await get().loadData();
    return newOrder;
  },

  updateOrder: async (id, updates) => {
    await api.updateOrder(id, updates);
    await get().loadData();
  },

  deleteOrder: async (id) => {
    await api.deleteOrder(id);
    await get().loadData();
  },

  cancelOrder: async (id) => {
    await api.updateOrder(id, { workStatus: 'Cancelled' });
    await get().loadData();
  },

  addOrderPayment: async (orderId, amount, mode, date, note) => {
    await api.addOrderPayment(orderId, { amount, mode, date, note });

    // Update balances
    const state = get();
    let newBank = state.bankBalance;
    let newCash = state.cashInHand;

    if (mode === 'Cash') {
      newCash += amount;
    } else {
      newBank += amount;
    }

    await api.updateBalances({
      bankBalance: newBank.toString(),
      cashInHand: newCash.toString(),
    });

    await get().loadData();
  },

  addExpense: async (expense) => {
    const amount = Number(expense.amount);
    await api.createExpense(expense);

    // Update balances
    const state = get();
    let newBank = state.bankBalance;
    let newCash = state.cashInHand;

    if (expense.mode === 'Bank' || expense.mode === 'UPI') {
      newBank -= amount;
    } else {
      newCash -= amount;
    }

    await api.updateBalances({
      bankBalance: newBank.toString(),
      cashInHand: newCash.toString(),
    });

    await get().loadData();
  },

  updateExpense: async (id, updates) => {
    const state = get();
    const oldExpense = state.expenses.find(e => e.id === id);
    if (!oldExpense) return;

    // Revert old transaction
    let newBank = state.bankBalance;
    let newCash = state.cashInHand;

    if (oldExpense.mode === 'Bank' || oldExpense.mode === 'UPI') {
      newBank += Number(oldExpense.amount);
    } else {
      newCash += Number(oldExpense.amount);
    }

    await api.updateExpense(id, updates);

    // Apply new transaction
    const newExpense = { ...oldExpense, ...updates };
    const newAmount = Number(newExpense.amount);

    if (newExpense.mode === 'Bank' || newExpense.mode === 'UPI') {
      newBank -= newAmount;
    } else {
      newCash -= newAmount;
    }

    await api.updateBalances({
      bankBalance: newBank.toString(),
      cashInHand: newCash.toString(),
    });

    await get().loadData();
  },

  deleteExpense: async (id) => {
    const state = get();
    const expense = state.expenses.find(e => e.id === id);
    if (!expense) return;

    await api.deleteExpense(id);

    // Revert money
    let newBank = state.bankBalance;
    let newCash = state.cashInHand;

    if (expense.mode === 'Bank' || expense.mode === 'UPI') {
      newBank += Number(expense.amount);
    } else {
      newCash += Number(expense.amount);
    }

    await api.updateBalances({
      bankBalance: newBank.toString(),
      cashInHand: newCash.toString(),
    });

    await get().loadData();
  },

  addTransaction: async (transaction) => {
    const amount = Number(transaction.amount);
    await api.createTransaction(transaction);

    const state = get();
    let newBank = state.bankBalance;
    let newCash = state.cashInHand;

    if (transaction.type === 'Deposit') {
      if (transaction.mode === 'Cash') {
        newCash += amount;
      } else {
        newBank += amount;
      }
    } else if (transaction.type === 'Withdraw') {
      if (transaction.mode === 'Cash') {
        newCash -= amount;
      } else {
        newBank -= amount;
      }
    }

    await api.updateBalances({
      bankBalance: newBank.toString(),
      cashInHand: newCash.toString(),
    });

    await get().loadData();
    await get().loadData();
  },

  updateTransaction: async (id, updates) => {
    // Only simple updates supported that don't change balance logic complexity for now
    await api.updateTransaction(id, updates);
    await get().loadData();
  },

  deleteTransaction: async (id, type, amount, mode) => {
    await api.deleteTransaction(id);

    // Reverse the balance impact
    const state = get();
    let newBank = state.bankBalance;
    let newCash = state.cashInHand;

    const numAmount = Number(amount);

    if (type === 'Deposit') {
      // Reversing deposit means removing funds
      if (mode === 'Cash') {
        newCash -= numAmount;
      } else {
        newBank -= numAmount;
      }
    } else if (type === 'Withdraw') {
      // Reversing withdraw means adding funds back
      if (mode === 'Cash') {
        newCash += numAmount;
      } else {
        newBank += numAmount;
      }
    }

    await api.updateBalances({
      bankBalance: newBank.toString(),
      cashInHand: newCash.toString(),
    });

    await get().loadData();
  },

  getTotalSales: () => {
    const state = get();
    return state.orders.reduce((total, order) => {
      const orderPaid = order.paymentHistory.reduce((pSum, p) => pSum + Number(p.amount), 0);
      return total + orderPaid;
    }, 0);
  },

  getTotalExpenses: () => {
    const state = get();
    return state.expenses.reduce((acc, expense) => acc + Number(expense.amount), 0);
  },

  getPendingOrdersCount: () => {
    const { orders } = get();
    return orders.filter(o => o.workStatus === 'Pending' || o.workStatus === 'In Progress').length;
  },
  getPendingSalesAmount: () => {
    const { orders } = get();
    return orders
      .filter(o => o.paymentStatus === 'Unpaid' || o.paymentStatus === 'Partial')
      .reduce((sum, o) => sum + Number(o.balanceAmount), 0);
  },

  updateBalances: async (updates) => {
    await api.updateBalances(updates);
    await get().loadData();
  }
}));
