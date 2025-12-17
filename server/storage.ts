import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export interface IStorage {
  // Orders
  getOrders(): Promise<schema.Order[]>;
  getOrderById(id: string): Promise<schema.Order | undefined>;
  createOrder(order: schema.InsertOrder): Promise<schema.Order>;
  updateOrder(id: string, updates: Partial<schema.InsertOrder>): Promise<schema.Order>;
  deleteOrder(id: string): Promise<void>;
  addOrderPayment(orderId: string, payment: { amount: number; mode: string; date: string; note?: string }): Promise<schema.Order>;

  // Expenses
  getExpenses(): Promise<schema.Expense[]>;
  createExpense(expense: schema.InsertExpense): Promise<schema.Expense>;
  updateExpense(id: string, updates: Partial<schema.InsertExpense>): Promise<schema.Expense>;
  deleteExpense(id: string): Promise<void>;

  // Transactions
  getTransactions(): Promise<schema.Transaction[]>;
  createTransaction(transaction: schema.InsertTransaction): Promise<schema.Transaction>;

  // Balances
  getBalances(): Promise<schema.Balance>;
  updateBalances(updates: { bankBalance?: string; cashInHand?: string }): Promise<schema.Balance>;
}

class StorageImpl implements IStorage {
  async getOrders(): Promise<schema.Order[]> {
    return await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  }

  async getOrderById(id: string): Promise<schema.Order | undefined> {
    const result = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return result[0];
  }

  async createOrder(order: schema.InsertOrder): Promise<schema.Order> {
    const result = await db.insert(schema.orders).values(order as any).returning();
    return result[0];
  }

  async updateOrder(id: string, updates: Partial<schema.InsertOrder>): Promise<schema.Order> {
    const result = await db
      .update(schema.orders)
      .set(updates as any)
      .where(eq(schema.orders.id, id))
      .returning();
    return result[0];
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(schema.orders).where(eq(schema.orders.id, id));
  }

  async addOrderPayment(
    orderId: string,
    payment: { amount: number; mode: string; date: string; note?: string }
  ): Promise<schema.Order> {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error("Order not found");

    const paymentHistory = order.paymentHistory as any[];
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
      paymentHistory: newHistory as any,
      balanceAmount: newBalance.toString(),
      advanceAmount: totalPaid.toString(),
      paymentStatus: newStatus,
    });
  }

  async getExpenses(): Promise<schema.Expense[]> {
    return await db.select().from(schema.expenses).orderBy(desc(schema.expenses.createdAt));
  }

  async createExpense(expense: schema.InsertExpense): Promise<schema.Expense> {
    const result = await db.insert(schema.expenses).values(expense).returning();
    return result[0];
  }

  async updateExpense(id: string, updates: Partial<schema.InsertExpense>): Promise<schema.Expense> {
    const result = await db
      .update(schema.expenses)
      .set(updates)
      .where(eq(schema.expenses.id, id))
      .returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
  }

  async getTransactions(): Promise<schema.Transaction[]> {
    return await db.select().from(schema.transactions).orderBy(desc(schema.transactions.createdAt));
  }

  async createTransaction(transaction: schema.InsertTransaction): Promise<schema.Transaction> {
    const result = await db.insert(schema.transactions).values(transaction).returning();
    return result[0];
  }

  async getBalances(): Promise<schema.Balance> {
    let result = await db.select().from(schema.balances).where(eq(schema.balances.id, 'singleton'));
    
    if (result.length === 0) {
      const newBalance = await db.insert(schema.balances).values({
        id: 'singleton',
        bankBalance: '25000',
        cashInHand: '5000',
      }).returning();
      return newBalance[0];
    }
    
    return result[0];
  }

  async updateBalances(updates: { bankBalance?: string; cashInHand?: string }): Promise<schema.Balance> {
    const result = await db
      .update(schema.balances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.balances.id, 'singleton'))
      .returning();
    return result[0];
  }
}

export const storage = new StorageImpl();
