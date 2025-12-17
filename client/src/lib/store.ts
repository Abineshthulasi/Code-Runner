import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';

// Types
export type TransactionMode = 'Cash' | 'Bank' | 'UPI';
export type WorkStatus = 'Pending' | 'In Progress' | 'Ready' | 'Cancelled';
export type DeliveryStatus = 'Pending' | 'Delivered' | 'Returned';
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
  advanceAmount: number; // Keep for legacy/simple view, but ideally derived from payments
  balanceAmount: number;
  
  workStatus: WorkStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  
  paymentHistory: PaymentRecord[];
  
  orderDate: string; // Date order was taken
  dueDate: string; // ISO date string
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
  
  // Actions
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'paymentHistory' | 'workStatus' | 'deliveryStatus' | 'paymentStatus' | 'balanceAmount' | 'advanceAmount'> & { initialPayment?: number, initialPaymentMode?: TransactionMode }) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  cancelOrder: (id: string) => void;
  
  addOrderPayment: (orderId: string, amount: number, mode: TransactionMode, date: string, note?: string) => void;

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  
  // Computeds
  getTotalSales: () => number;
  getTotalExpenses: () => number;
  getPendingOrdersCount: () => number;
}

// Mock Data
const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    clientName: 'Priya Sharma',
    phone: '9876543210',
    items: [{ id: 'i1', description: 'Designer Lehenga', quantity: 1, price: 15000 }],
    totalAmount: 15000,
    advanceAmount: 5000,
    balanceAmount: 10000,
    workStatus: 'In Progress',
    deliveryStatus: 'Pending',
    paymentStatus: 'Partial',
    paymentHistory: [
      { id: 'p1', amount: 5000, date: '2025-12-15', mode: 'UPI', note: 'Advance' }
    ],
    orderDate: '2025-12-15',
    dueDate: '2025-12-25',
    createdAt: '2025-12-15T10:00:00Z',
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    clientName: 'Anjali Verma',
    phone: '9988776655',
    items: [{ id: 'i2', description: 'Silk Saree Blouse', quantity: 2, price: 2500 }],
    totalAmount: 5000,
    advanceAmount: 0,
    balanceAmount: 5000,
    workStatus: 'Pending',
    deliveryStatus: 'Pending',
    paymentStatus: 'Unpaid',
    paymentHistory: [],
    orderDate: '2025-12-16',
    dueDate: '2025-12-20',
    createdAt: '2025-12-16T14:30:00Z',
  }
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      bankBalance: 25000,
      cashInHand: 5000,
      orders: MOCK_ORDERS,
      expenses: [],
      transactions: [],

      addOrder: ({ initialPayment = 0, initialPaymentMode = 'Cash', ...orderData }) => set((state) => {
        const paymentHistory: PaymentRecord[] = [];
        let balance = orderData.totalAmount;
        let pStatus: PaymentStatus = 'Unpaid';

        if (initialPayment > 0) {
          paymentHistory.push({
            id: nanoid(),
            amount: initialPayment,
            date: orderData.orderDate,
            mode: initialPaymentMode,
            note: 'Advance Payment'
          });
          balance -= initialPayment;
          pStatus = balance <= 0 ? 'Paid' : 'Partial';
        }

        const newOrder: Order = {
          ...orderData,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          paymentHistory,
          advanceAmount: initialPayment,
          balanceAmount: balance,
          workStatus: 'Pending',
          deliveryStatus: 'Pending',
          paymentStatus: pStatus
        };

        // Handle money movement for advance
        let newBank = state.bankBalance;
        let newCash = state.cashInHand;
        
        if (initialPayment > 0) {
          if (initialPaymentMode === 'Cash') {
            newCash += initialPayment;
          } else {
            newBank += initialPayment;
          }
        }

        return {
          orders: [newOrder, ...state.orders],
          bankBalance: newBank,
          cashInHand: newCash
        };
      }),

      updateOrder: (id, updates) => set((state) => ({
        orders: state.orders.map((order) => 
          order.id === id ? { ...order, ...updates } : order
        )
      })),

      deleteOrder: (id) => set((state) => ({
        orders: state.orders.filter((o) => o.id !== id)
      })),

      cancelOrder: (id) => set((state) => ({
        orders: state.orders.map((o) => o.id === id ? { ...o, workStatus: 'Cancelled' } : o)
      })),

      addOrderPayment: (orderId, amount, mode, date, note) => set((state) => {
        const orderIndex = state.orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return state;

        const order = state.orders[orderIndex];
        const newHistory = [
          ...order.paymentHistory,
          { id: nanoid(), amount, mode, date, note }
        ];

        const totalPaid = newHistory.reduce((sum, p) => sum + Number(p.amount), 0);
        const newBalance = order.totalAmount - totalPaid;
        const newStatus: PaymentStatus = newBalance <= 0 ? 'Paid' : 'Partial';

        const updatedOrder = {
          ...order,
          paymentHistory: newHistory,
          balanceAmount: newBalance,
          paymentStatus: newStatus,
          // Update legacy advance amount field if needed, or just rely on history
          advanceAmount: totalPaid 
        };

        const newOrders = [...state.orders];
        newOrders[orderIndex] = updatedOrder;

        // Update funds
        let newBank = state.bankBalance;
        let newCash = state.cashInHand;
        if (mode === 'Cash') {
          newCash += Number(amount);
        } else {
          newBank += Number(amount);
        }

        return {
          orders: newOrders,
          bankBalance: newBank,
          cashInHand: newCash
        };
      }),

      addExpense: (expense) => set((state) => {
        const amount = Number(expense.amount);
        const newState = {
          expenses: [{ ...expense, id: nanoid() }, ...state.expenses],
          bankBalance: state.bankBalance,
          cashInHand: state.cashInHand
        };

        if (expense.mode === 'Bank' || expense.mode === 'UPI') {
          newState.bankBalance -= amount;
        } else {
          newState.cashInHand -= amount;
        }
        
        return newState;
      }),

      updateExpense: (id, updates) => set((state) => {
        const oldExpense = state.expenses.find(e => e.id === id);
        if (!oldExpense) return state;

        // Revert old transaction effect
        let newBank = state.bankBalance;
        let newCash = state.cashInHand;

        if (oldExpense.mode === 'Bank' || oldExpense.mode === 'UPI') {
          newBank += Number(oldExpense.amount);
        } else {
          newCash += Number(oldExpense.amount);
        }

        // Apply new transaction effect
        const newExpense = { ...oldExpense, ...updates };
        const newAmount = Number(newExpense.amount);

        if (newExpense.mode === 'Bank' || newExpense.mode === 'UPI') {
          newBank -= newAmount;
        } else {
          newCash -= newAmount;
        }

        return {
          expenses: state.expenses.map(e => e.id === id ? newExpense : e),
          bankBalance: newBank,
          cashInHand: newCash
        };
      }),

      deleteExpense: (id) => set((state) => {
        const expense = state.expenses.find(e => e.id === id);
        if (!expense) return state;

        // Revert money
        let newBank = state.bankBalance;
        let newCash = state.cashInHand;

        if (expense.mode === 'Bank' || expense.mode === 'UPI') {
          newBank += Number(expense.amount);
        } else {
          newCash += Number(expense.amount);
        }

        return {
          expenses: state.expenses.filter((e) => e.id !== id),
          bankBalance: newBank,
          cashInHand: newCash
        };
      }),

      addTransaction: (transaction) => set((state) => {
        const amount = Number(transaction.amount);
        const newState = {
          transactions: [{ ...transaction, id: nanoid() }, ...state.transactions],
          bankBalance: state.bankBalance,
          cashInHand: state.cashInHand
        };

        if (transaction.type === 'Deposit') {
          // Add funds to the target account
          // If I deposit "Cash", it means I am adding Cash to my Cash-in-hand? 
          // OR does "Deposit" + "Cash" mean I am depositing Cash INTO the Bank?
          // The user said: "if i deposite to bank i want the mode wether i put in bank or cash"
          // This implies "Add Funds" -> Where is the source? 
          // Let's assume:
          // "Add Funds" = Injection of capital into the business.
          // Mode = Where the money lands.
          // Cash = Adds to Cash in Hand.
          // Bank = Adds to Bank Balance.
          
          if (transaction.mode === 'Cash') {
             newState.cashInHand += amount;
          } else {
             newState.bankBalance += amount;
          }

        } else if (transaction.type === 'Withdraw') {
           // Remove funds from business
           if (transaction.mode === 'Cash') {
             newState.cashInHand -= amount;
           } else {
             newState.bankBalance -= amount;
           }
        }

        return newState;
      }),

      getTotalSales: () => {
        const state = get();
        // Sum of all payments received
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
        const state = get();
        return state.orders.filter(o => o.workStatus !== 'Ready' && o.workStatus !== 'Cancelled').length;
      }
    }),
    {
      name: 'bobiz-atelier-storage', // unique name
      storage: createJSONStorage(() => localStorage),
    }
  )
);

