
import { Order, Expense, Transaction } from './store';
import { Balance } from '@shared/schema';

export const mockBalances: Balance = {
    id: 'singleton',
    bankBalance: '45000',
    cashInHand: '12500',
    updatedAt: new Date()
};

export const mockOrders: Order[] = [
    {
        id: 'guest-1',
        orderNumber: 'ORD-DEMO01',
        clientName: 'Alice Styles',
        phone: '9876543210',
        items: [
            { id: 'i1', description: 'Silk Saree Blouse', quantity: 1, price: 1500, discount: 0 },
            { id: 'i2', description: 'Embroidery Work', quantity: 1, price: 2500, discount: 0 }
        ],
        totalAmount: 4000,
        advanceAmount: 2000,
        balanceAmount: 2000,
        workStatus: 'In Progress',
        deliveryStatus: 'Pending',
        paymentStatus: 'Partial',
        paymentHistory: [
            { id: 'ph1', amount: 2000, date: new Date().toISOString(), mode: 'Cash', note: 'Advance' }
        ],
        orderDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        createdAt: new Date().toISOString()
    },
    {
        id: 'guest-2',
        orderNumber: 'ORD-DEMO02',
        clientName: 'Sarah Fashion',
        phone: '9876543211',
        items: [
            { id: 'i3', description: 'Cotton Kurti', quantity: 2, price: 800, discount: 100 }
        ],
        totalAmount: 1500,
        advanceAmount: 1500,
        balanceAmount: 0,
        workStatus: 'Ready',
        deliveryStatus: 'Delivered',
        paymentStatus: 'Paid',
        paymentHistory: [
            { id: 'ph2', amount: 1500, date: new Date(Date.now() - 86400000).toISOString(), mode: 'UPI', note: 'Full Payment' }
        ],
        orderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        deliveryDate: new Date(Date.now() - 86400000).toISOString(),
        dueDate: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
];

export const mockExpenses: Expense[] = [
    {
        id: 'exp-1',
        description: 'Thread Purchase',
        category: 'Materials',
        amount: 2500,
        date: new Date().toISOString(),
        mode: 'Cash'
    },
    {
        id: 'exp-2',
        description: 'Shop Rent',
        category: 'Rent',
        amount: 15000,
        date: new Date(Date.now() - 86400000 * 10).toISOString(),
        mode: 'Bank'
    }
];

export const mockTransactions: Transaction[] = [
    {
        id: 'tx-1',
        type: 'Deposit',
        amount: 5000,
        description: 'Weekly Sales Deposit',
        date: new Date().toISOString(),
        mode: 'Bank'
    }
];
