import * as XLSX from 'xlsx';
import { Order, Expense } from './store';
import { format } from 'date-fns';

export const exportOrdersToExcel = (orders: Order[], filename: string) => {
    const data = orders.map(order => {
        // Calculate totals
        const totalPaid = order.paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);

        // Format items string
        const itemsString = order.items
            .map(i => `${i.description} (x${i.quantity})`)
            .join(', ');

        return {
            'Order No': order.orderNumber,
            'Date': order.orderDate, // Keep as YYYY-MM-DD for sorting/Excel to recognize
            'Client Name': order.clientName,
            'Phone': order.phone,
            'Items': itemsString,
            'Work Status': order.workStatus,
            'Delivery Status': order.deliveryStatus,
            'Delivered Date': order.deliveryDate || '',
            'Payment Status': order.paymentStatus,
            'Total Amount': order.totalAmount,
            'Paid Amount': totalPaid,
            'Balance Amount': order.balanceAmount,
            'Notes': order.notes || ''
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    // Adjust column widths roughly
    const wscols = [
        { wch: 15 }, // Order No
        { wch: 12 }, // Date
        { wch: 20 }, // Client
        { wch: 15 }, // Phone
        { wch: 40 }, // Items
        { wch: 15 }, // Work Status
        { wch: 15 }, // Delivery Status
        { wch: 15 }, // Delivered Date
        { wch: 15 }, // Payment Status
        { wch: 12 }, // Total
        { wch: 12 }, // Paid
        { wch: 12 }, // Balance
        { wch: 30 }  // Notes
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportExpensesToExcel = (expenses: Expense[], filename: string) => {
    const data = expenses.map(expense => ({
        'Date': expense.date,
        'Category': expense.category,
        'Description': expense.description,
        'Mode': expense.mode,
        'Amount': expense.amount
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    const wscols = [
        { wch: 12 }, // Date
        { wch: 20 }, // Category
        { wch: 40 }, // Description
        { wch: 10 }, // Mode
        { wch: 12 }  // Amount
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportTransactionsToExcel = (transactions: any[], filename: string) => {
    const data = transactions.map(tx => ({
        'Date': tx.date,
        'Description': tx.description,
        'Category': tx.category || 'N/A',
        'Type': tx.type, // Credit/Debit
        'Amount': tx.amount,
        'Mode': tx.mode
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    const wscols = [
        { wch: 15 }, // Date
        { wch: 40 }, // Description
        { wch: 20 }, // Category
        { wch: 10 }, // Type
        { wch: 15 }, // Amount
        { wch: 10 }  // Mode
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportMonthlyStatsToExcel = (monthlyData: any[], filename: string) => {
    const data = monthlyData.map(m => ({
        'Month': `${m.month} ${m.year}`,
        'Total Sales Made': m.totalSales,
        'Sales Received (Total)': m.sales,
        'Sales (Cash)': m.salesCash,
        'Sales (Bank)': m.salesBank,
        'Expenses (Total)': m.expenses,
        'Expenses (Cash)': m.expensesCash,
        'Expenses (Bank)': m.expensesBank,
        'Deposits (Total)': m.deposits,
        'Deposits (Cash)': m.depositsCash,
        'Deposits (Bank)': m.depositsBank,
        'Withdrawals (Total)': m.withdrawals,
        'Withdrawals (Cash)': m.withdrawalsCash,
        'Withdrawals (Bank)': m.withdrawalsBank,
        'Pending Amount (New)': m.pending,
        'Prev Month Recovery': m.prevMonthRecovery,
        'Opening Balance (Cash)': m.openingCash,
        'Closing Balance (Cash)': m.closingCash,
        'Opening Balance (Bank)': m.openingBank,
        'Closing Balance (Bank)': m.closingBank
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    // Add summary row at the bottom?
    // For now just raw data
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");

    const wscols = [
        { wch: 15 }, // Month
        { wch: 15 }, // Total Sales Made
        { wch: 18 }, // Sales Recv
        { wch: 12 }, // Sales Cash
        { wch: 12 }, // Sales Bank
        { wch: 15 }, // Expenses
        { wch: 12 }, // Exp Cash
        { wch: 12 }, // Exp Bank
        { wch: 15 }, // Deposits
        { wch: 12 }, // Dep Cash
        { wch: 12 }, // Dep Bank
        { wch: 15 }, // Withdrawals
        { wch: 12 }, // W/D Cash
        { wch: 12 }, // W/D Bank
        { wch: 15 }, // Pending
        { wch: 18 }, // Recovery
        { wch: 20 }, // Open Cash
        { wch: 20 }, // Close Cash
        { wch: 20 }, // Open Bank
        { wch: 20 }  // Close Bank
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

