import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  clientName: text("client_name").notNull(),
  phone: varchar("phone", { length: 20 }),
  items: jsonb("items").notNull().$type<Array<{
    id: string;
    description: string;
    quantity: number;
    price: number;
    discount?: number;
  }>>(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  advanceAmount: decimal("advance_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  balanceAmount: decimal("balance_amount", { precision: 10, scale: 2 }).notNull(),
  workStatus: varchar("work_status", { length: 20 }).notNull().default('Pending'),
  deliveryStatus: varchar("delivery_status", { length: 30 }).notNull().default('Pending'),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default('Unpaid'),
  paymentHistory: jsonb("payment_history").notNull().$type<Array<{
    id: string;
    amount: number;
    date: string;
    mode: string;
    note?: string;
  }>>().default(sql`'[]'::jsonb`),
  orderDate: varchar("order_date", { length: 20 }).notNull(),
  dueDate: varchar("due_date", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  mode: varchar("mode", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  mode: varchar("mode", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const balances = pgTable("balances", {
  id: varchar("id").primaryKey().default('singleton'),
  bankBalance: decimal("bank_balance", { precision: 12, scale: 2 }).notNull().default('0'),
  cashInHand: decimal("cash_in_hand", { precision: 12, scale: 2 }).notNull().default('0'),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "manager", "staff"] }).notNull().default("staff"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Balance = typeof balances.$inferSelect;
