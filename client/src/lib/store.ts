import { create } from 'zustand';
import { api } from './api';
import { mockOrders, mockExpenses, mockTransactions, mockBalances } from './mockData';

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
  discount?: number;
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
  updatedAt?: string;
  deliveryDate?: string;
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

  // Guest Mode State
  isGuestMode: boolean;
  setGuestMode: (enabled: boolean) => void;

  // Data Loading
  isLoading: boolean;
  loadData: () => Promise<void>;

  // Actions
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'paymentHistory' | 'workStatus' | 'deliveryStatus' | 'paymentStatus' | 'balanceAmount' | 'advanceAmount'> & { initialPayment?: number, initialPaymentMode?: TransactionMode }) => Promise<Order>;
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
  isGuestMode: localStorage.getItem('isGuestMode') === 'true',

  setGuestMode: (enabled: boolean) => {
    localStorage.setItem('isGuestMode', String(enabled));
    set({ isGuestMode: enabled });
    if (enabled) {
      // Load mock data immediately
      get().loadData();
    } else {
      // Clear data and reload from API
      set({ orders: [], expenses: [], transactions: [], bankBalance: 0, cashInHand: 0 });
      get().loadData();
    }
  },

  loadData: async () => {
    set({ isLoading: true });
    try {
      if (get().isGuestMode) {
        // MOCK DATA LOAD
        setTimeout(() => { // Simulate delay
          set({
            bankBalance: toNumber(mockBalances.bankBalance),
            cashInHand: toNumber(mockBalances.cashInHand),
            orders: [...mockOrders],
            expenses: [...mockExpenses],
            transactions: [...mockTransactions],
            isLoading: false
          });
        }, 500);
        return;
      }

      // API LOAD
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

    if (get().isGuestMode) {
      // GUEST MODE: Update local state
      const newOrder: Order = {
        id: `guest-new-${Date.now()}`,
        ...orderData,
        createdAt: new Date().toISOString(),
        paymentHistory,
        advanceAmount: initialPayment,
        balanceAmount: balance,
        workStatus: 'Pending',
        deliveryStatus: 'Pending',
        paymentStatus: pStatus,
        totalAmount: orderData.totalAmount
      };

      set(state => ({
        orders: [newOrder, ...state.orders]
      }));

      // Balance update logic duplicated for guest mode
      if (initialPayment > 0) {
        const state = get();
        let newBank = state.bankBalance;
        let newCash = state.cashInHand;
        if (initialPaymentMode === 'Cash') newCash += initialPayment;
        else newBank += initialPayment;
        set({ bankBalance: newBank, cashInHand: newCash });
      }

      return newOrder;
    }

    // REGULAR MODE
    const newOrder = await api.createOrder({
      ...orderData,
      paymentHistory,
      advanceAmount: initialPayment.toString(),
      balanceAmount: balance.toString(),
      workStatus: 'Pending',
      deliveryStatus: 'Pending',
      paymentStatus: pStatus
    });

    // Update local balances (API sync)
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

    // Convert to Store Order type
    return {
      ...newOrder,
      totalAmount: Number(newOrder.totalAmount),
      advanceAmount: Number(newOrder.advanceAmount),
      balanceAmount: Number(newOrder.balanceAmount),
      workStatus: newOrder.workStatus as any,
      deliveryStatus: newOrder.deliveryStatus as any,
      paymentStatus: newOrder.paymentStatus as any,
      paymentHistory: newOrder.paymentHistory.map(p => ({
        ...p,
        mode: p.mode as any
      }))
    };
  },

  updateOrder: async (id, updates) => {
    // Logic for Cancellation
    if (updates.workStatus === 'Cancelled') {
      updates = { ...updates, balanceAmount: 0 };
    }

    if (get().isGuestMode) {
      set(state => ({
        orders: state.orders.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o)
      }));
      return;
    }
    await api.updateOrder(id, updates);
    await get().loadData();
  },

  deleteOrder: async (id) => {
    const state = get();
    const order = state.orders.find(o => o.id === id);

    // Common Balance Reversal Logic
    if (order) {
      let newBank = state.bankBalance;
      let newCash = state.cashInHand;
      let balanceChanged = false;

      // Reverse all payments in history
      order.paymentHistory.forEach(p => {
        const amount = Number(p.amount);
        if (p.mode === 'Cash') {
          newCash -= amount;
        } else {
          newBank -= amount;
        }
        balanceChanged = true;
      });

      if (balanceChanged) {
        if (state.isGuestMode) {
          set({ bankBalance: newBank, cashInHand: newCash });
        } else {
          await api.updateBalances({
            bankBalance: newBank.toString(),
            cashInHand: newCash.toString(),
          });
        }
      }
    }

    if (state.isGuestMode) {
      set(s => ({ orders: s.orders.filter(o => o.id !== id) }));
      return;
    }

    await api.deleteOrder(id);
    await get().loadData();
  },

  cancelOrder: async (id) => {
    if (get().isGuestMode) {
      set(state => ({
        orders: state.orders.map(o => o.id === id ? { ...o, workStatus: 'Cancelled' } : o)
      }));
      return;
    }
    await api.updateOrder(id, { workStatus: 'Cancelled' });
    await get().loadData();
  },

  addOrderPayment: async (orderId, amount, mode, date, note) => {
    if (get().isGuestMode) {
      set(state => {
        const order = state.orders.find(o => o.id === orderId);
        if (!order) return state;

        const newHistory = [...order.paymentHistory, {
          id: `guest-pay-${Date.now()}`,
          amount, mode, date, note
        }];

        const totalPaid = newHistory.reduce((sum, p) => sum + p.amount, 0);
        const newBalance = order.totalAmount - totalPaid;
        const newStatus = newBalance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';

        const newCash = mode === 'Cash' ? state.cashInHand + amount : state.cashInHand;
        const newBank = mode !== 'Cash' ? state.bankBalance + amount : state.bankBalance;

        return {
          cashInHand: newCash,
          bankBalance: newBank,
          orders: state.orders.map(o => o.id === orderId ? {
            ...o,
            paymentHistory: newHistory,
            balanceAmount: newBalance,
            advanceAmount: totalPaid,
            paymentStatus: newStatus
          } : o)
        };
      });
      return;
    }

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

    if (get().isGuestMode) {
      set(state => {
        const newCash = (expense.mode === 'Cash') ? state.cashInHand - amount : state.cashInHand;
        const newBank = (expense.mode !== 'Cash') ? state.bankBalance - amount : state.bankBalance;

        return {
          cashInHand: newCash,
          bankBalance: newBank,
          expenses: [{
            id: `guest-exp-${Date.now()}`,
            ...expense,
            date: expense.date || new Date().toISOString()
          }, ...state.expenses]
        }
      });
      return;
    }

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
    if (get().isGuestMode) {
      set(state => {
        const oldExp = state.expenses.find(e => e.id === id);
        if (!oldExp) return state;

        // Revert old
        let newCash = state.cashInHand;
        let newBank = state.bankBalance;
        if (oldExp.mode === 'Cash') newCash += oldExp.amount;
        else newBank += oldExp.amount;

        // Apply new
        const newExp = { ...oldExp, ...updates };
        if (newExp.mode === 'Cash') newCash -= newExp.amount;
        else newBank -= newExp.amount;

        return {
          cashInHand: newCash,
          bankBalance: newBank,
          expenses: state.expenses.map(e => e.id === id ? newExp : e)
        };
      });
      return;
    }

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
    if (get().isGuestMode) {
      set(state => {
        const exp = state.expenses.find(e => e.id === id);
        if (!exp) return state;

        const newCash = (exp.mode === 'Cash') ? state.cashInHand + exp.amount : state.cashInHand;
        const newBank = (exp.mode !== 'Cash') ? state.bankBalance + exp.amount : state.bankBalance;

        return {
          cashInHand: newCash,
          bankBalance: newBank,
          expenses: state.expenses.filter(e => e.id !== id)
        };
      });
      return;
    }

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

    if (get().isGuestMode) {
      set(state => {
        let newCash = state.cashInHand;
        let newBank = state.bankBalance;

        if (transaction.type === 'Deposit') {
          if (transaction.mode === 'Cash') newCash += amount;
          else newBank += amount;
        } else { // Withdraw
          if (transaction.mode === 'Cash') newCash -= amount;
          else newBank -= amount;
        }

        return {
          cashInHand: newCash,
          bankBalance: newBank,
          transactions: [{
            id: `guest-tx-${Date.now()}`,
            ...transaction,
            date: transaction.date || new Date().toISOString() // Ensure date is string
          }, ...state.transactions]
        }
      });
      return;
    }

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
    if (get().isGuestMode) {
      // Simple guest update (skipping balance recalc for brevity in demo, but should ideally do it)
      set(state => ({
        transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
      }));
      return;
    }

    const state = get();
    const oldTx = state.transactions.find(t => t.id === id);
    if (!oldTx) return;

    // 1. Revert old transaction
    let newBank = state.bankBalance;
    let newCash = state.cashInHand;
    const oldAmount = Number(oldTx.amount);

    if (oldTx.type === 'Deposit') {
      if (oldTx.mode === 'Cash') newCash -= oldAmount;
      else newBank -= oldAmount;
    } else { // Withdraw
      if (oldTx.mode === 'Cash') newCash += oldAmount;
      else newBank += oldAmount;
    }

    // 2. Apply new transaction
    const newTx = { ...oldTx, ...updates };
    const newAmount = Number(newTx.amount);

    if (newTx.type === 'Deposit') {
      if (newTx.mode === 'Cash') newCash += newAmount;
      else newBank += newAmount;
    } else { // Withdraw
      if (newTx.mode === 'Cash') newCash -= newAmount;
      else newBank -= newAmount;
    }

    await api.updateBalances({
      bankBalance: newBank.toString(),
      cashInHand: newCash.toString(),
    });

    await api.updateTransaction(id, updates);
    await get().loadData();
  },

  deleteTransaction: async (id, type, amount, mode) => {
    if (get().isGuestMode) {
      set(state => {
        let newCash = state.cashInHand;
        let newBank = state.bankBalance;
        const numAmount = Number(amount);

        if (type === 'Deposit') {
          if (mode === 'Cash') newCash -= numAmount;
          else newBank -= numAmount;
        } else { // Withdraw
          if (mode === 'Cash') newCash += numAmount;
          else newBank += numAmount;
        }

        return {
          cashInHand: newCash,
          bankBalance: newBank,
          transactions: state.transactions.filter(t => t.id !== id)
        };
      });
      return;
    }

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
    if (get().isGuestMode) {
      set(state => ({
        ...state,
        bankBalance: updates.bankBalance ? Number(updates.bankBalance) : state.bankBalance,
        cashInHand: updates.cashInHand ? Number(updates.cashInHand) : state.cashInHand
      }));
      return;
    }
    await api.updateBalances(updates);
    await get().loadData();
  }
}));
