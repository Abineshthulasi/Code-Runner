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
            'Delivered Date': order.deliveredDate || '',
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
