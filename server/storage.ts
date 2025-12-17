import { orders, expenses, transactions, balances } from "@shared/schema";
import type { Order, InsertOrder, Expense, InsertExpense, Transaction, InsertTransaction, Balance } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  addOrderPayment(orderId: string, payment: { amount: number; mode: string; date: string; note?: string }): Promise<Order>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, updates: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;

  // Transactions
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Balances
  getBalances(): Promise<Balance>;
  updateBalances(updates: { bankBalance?: string; cashInHand?: string }): Promise<Balance>;
}

export class DbStorage implements IStorage {
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values({
        ...insertOrder,
        advanceAmount: insertOrder.advanceAmount || '0',
        workStatus: insertOrder.workStatus || 'Pending',
        deliveryStatus: insertOrder.deliveryStatus || 'Pending',
        paymentStatus: insertOrder.paymentStatus || 'Unpaid',
        paymentHistory: insertOrder.paymentHistory || [],
        notes: insertOrder.notes || null,
      })
      .returning();
    return order;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) throw new Error("Order not found");
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  async addOrderPayment(
    orderId: string,
    payment: { amount: number; mode: string; date: string; note?: string }
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error("Order not found");

    const paymentHistory = (order.paymentHistory as any[]) || [];
    const newHistory = [
      ...paymentHistory,
      {
        id: crypto.randomUUID(),
        amount: payment.amount,
        mode: payment.mode,
        date: payment.date,
        note: payment.note,
      },
    ];

    const totalPaid = newHistory.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAmount = Number(order.totalAmount);
    const newBalance = totalAmount - totalPaid;
    const newStatus = newBalance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';

    return await this.updateOrder(orderId, {
      paymentHistory: newHistory,
      balanceAmount: newBalance.toString(),
      advanceAmount: totalPaid.toString(),
      paymentStatus: newStatus,
    });
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(insertExpense).returning();
    return expense;
  }

  async updateExpense(id: string, updates: Partial<InsertExpense>): Promise<Expense> {
    const [expense] = await db
      .update(expenses)
      .set(updates)
      .where(eq(expenses.id, id))
      .returning();

    if (!expense) throw new Error("Expense not found");
    return expense;
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getBalances(): Promise<Balance> {
    let [balance] = await db.select().from(balances).where(eq(balances.id, "singleton"));

    if (!balance) {
      // Initialize default balance if it doesn't exist
      [balance] = await db.insert(balances).values({
        id: "singleton",
        bankBalance: "25000",
        cashInHand: "5000",
      }).returning();
    }

    return balance;
  }

  async updateBalances(updates: { bankBalance?: string; cashInHand?: string }): Promise<Balance> {
    const [balance] = await db
      .update(balances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(balances.id, "singleton"))
      .returning();

    // Handle edge case where balance row might verify missing during update (unlikely if getBalances called first)
    if (!balance) {
      return await this.getBalances();
    }

    return balance;
  }
}

export class MemStorage implements IStorage {
  private orders: Map<string, Order>;
  private expenses: Map<string, Expense>;
  private transactions: Map<string, Transaction>;
  private balance: Balance;

  constructor() {
    this.orders = new Map();
    this.expenses = new Map();
    this.transactions = new Map();
    this.balance = {
      id: "singleton",
      bankBalance: "25000",
      cashInHand: "5000",
      updatedAt: new Date()
    };
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = (this.orders.size + 1).toString();
    const order: Order = {
      ...insertOrder,
      id,
      createdAt: new Date(),
      advanceAmount: insertOrder.advanceAmount || '0',
      workStatus: insertOrder.workStatus || 'Pending',
      deliveryStatus: insertOrder.deliveryStatus || 'Pending',
      paymentStatus: insertOrder.paymentStatus || 'Unpaid',
      paymentHistory: insertOrder.paymentHistory || [],
      notes: insertOrder.notes || null,
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const existing = this.orders.get(id);
    if (!existing) throw new Error("Order not found");
    const updated = { ...existing, ...updates };
    this.orders.set(id, updated);
    return updated;
  }

  async deleteOrder(id: string): Promise<void> {
    this.orders.delete(id);
  }

  async addOrderPayment(
    orderId: string,
    payment: { amount: number; mode: string; date: string; note?: string }
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error("Order not found");

    const paymentHistory = order.paymentHistory || [];
    const newHistory = [
      ...paymentHistory,
      {
        id: crypto.randomUUID(),
        amount: payment.amount,
        mode: payment.mode,
        date: payment.date,
        note: payment.note,
      },
    ];

    const totalPaid = newHistory.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAmount = Number(order.totalAmount);
    const newBalance = totalAmount - totalPaid;
    const newStatus = newBalance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';

    return await this.updateOrder(orderId, {
      paymentHistory: newHistory,
      balanceAmount: newBalance.toString(),
      advanceAmount: totalPaid.toString(),
      paymentStatus: newStatus,
    });
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = (this.expenses.size + 1).toString();
    const expense: Expense = { ...insertExpense, id, createdAt: new Date() };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: string, updates: Partial<InsertExpense>): Promise<Expense> {
    const existing = this.expenses.get(id);
    if (!existing) throw new Error("Expense not found");
    const updated = { ...existing, ...updates };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string): Promise<void> {
    this.expenses.delete(id);
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = (this.transactions.size + 1).toString();
    const transaction: Transaction = { ...insertTransaction, id, createdAt: new Date() };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getBalances(): Promise<Balance> {
    return this.balance;
  }

  async updateBalances(updates: { bankBalance?: string; cashInHand?: string }): Promise<Balance> {
    this.balance = { ...this.balance, ...updates, updatedAt: new Date() };
    return this.balance;
  }
}

export const storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();
