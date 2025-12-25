// API client for backend communication

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
  mode: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  phone: string;
  items: OrderItem[];
  totalAmount: string;
  advanceAmount: string;
  balanceAmount: string;
  workStatus: string;
  deliveryStatus: string;
  paymentStatus: string;
  paymentHistory: PaymentRecord[];
  orderDate: string;
  dueDate: string;
  notes?: string;
  deliveryDate?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: string;
  date: string;
  mode: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  date: string;
  mode: string;
  createdAt: string;
}

export interface Balance {
  id: string;
  bankBalance: string;
  cashInHand: string;
  updatedAt: string;
}

class ApiClient {
  private baseUrl = "/api";

  async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return this.fetchJson<Order[]>("/orders");
  }

  async getOrder(id: string): Promise<Order> {
    return this.fetchJson<Order>(`/orders/${id}`);
  }

  async createOrder(order: any): Promise<Order> {
    return this.fetchJson<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  }

  async updateOrder(id: string, updates: any): Promise<Order> {
    return this.fetchJson<Order>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteOrder(id: string): Promise<void> {
    return this.fetchJson<void>(`/orders/${id}`, {
      method: "DELETE",
    });
  }

  async addOrderPayment(
    orderId: string,
    payment: { amount: number; mode: string; date: string; note?: string }
  ): Promise<Order> {
    return this.fetchJson<Order>(`/orders/${orderId}/payments`, {
      method: "POST",
      body: JSON.stringify(payment),
    });
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return this.fetchJson<Expense[]>("/expenses");
  }

  async createExpense(expense: any): Promise<Expense> {
    return this.fetchJson<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(id: string, updates: any): Promise<Expense> {
    return this.fetchJson<Expense>(`/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteExpense(id: string): Promise<void> {
    return this.fetchJson<void>(`/expenses/${id}`, {
      method: "DELETE",
    });
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return this.fetchJson<Transaction[]>("/transactions");
  }

  async createTransaction(transaction: any): Promise<Transaction> {
    return this.fetchJson<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    });
  }

  async updateTransaction(id: string, updates: any): Promise<Transaction> {
    return this.fetchJson<Transaction>(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    return this.fetchJson<void>(`/transactions/${id}`, {
      method: "DELETE",
    });
  }

  // Balances
  async getBalances(): Promise<Balance> {
    return this.fetchJson<Balance>("/balances");
  }

  async updateBalances(updates: { bankBalance?: string; cashInHand?: string }): Promise<Balance> {
    return this.fetchJson<Balance>("/balances", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }
}

export const api = new ApiClient();
