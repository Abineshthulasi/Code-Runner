
import { useRoute } from "wouter";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

export default function PrintBill() {
    const [, params] = useRoute("/print-bill/:id");
    const store = useStore();
    const orderId = params?.id;

    const order = store.orders.find(o => o.id === orderId);

    useEffect(() => {
        if (order) {
            document.title = `Bill-${order.orderNumber}`;
        }
    }, [order]);

    if (!order) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white p-8 max-w-[210mm] mx-auto">
            {/* Print Controls - Hidden in print */}
            <div className="print:hidden mb-8 flex justify-end">
                <Button onClick={handlePrint} className="flex gap-2">
                    <Printer className="w-4 h-4" /> Print Bill
                </Button>
            </div>

            {/* Bill Content */}
            <div className="space-y-6 text-black">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-6">
                    <div>
                        <h1 className="text-4xl font-serif font-bold tracking-tight">Bobiz Designer Studio</h1>
                        <p className="text-sm mt-1 text-gray-600"></p>
                    </div>
                    <div className="text-right text-sm">
                        <h2 className="font-bold text-lg mb-1">INVOICE</h2>
                        <p className="text-gray-600">Order #: {order.orderNumber}</p>
                        <p className="text-gray-600">Date: {format(parseISO(order.orderDate), 'dd-MM-yyyy')}</p>
                    </div>
                </div>

                {/* Client & Order Details */}
                <div className="grid grid-cols-2 gap-8 py-4">
                    <div>
                        <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">Bill To</h3>
                        <p className="font-medium text-lg">{order.clientName}</p>
                        <p className="text-gray-600">{order.phone}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2">Details</h3>
                        <p><span className="text-gray-600">Due Date:</span> {order.dueDate ? format(parseISO(order.dueDate), 'dd-MM-yyyy') : 'N/A'}</p>
                        <p><span className="text-gray-600">Status:</span> {order.paymentStatus}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mt-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="py-3 px-2 font-bold text-sm uppercase text-left">Item Description</th>
                                <th className="py-3 px-2 text-center font-bold text-sm uppercase w-16">Qty</th>
                                <th className="py-3 px-2 text-right font-bold text-sm uppercase w-28">Rate</th>
                                <th className="py-3 px-2 text-right font-bold text-sm uppercase w-28">Discount</th>
                                <th className="py-3 px-2 text-right font-bold text-sm uppercase w-32">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {order.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="py-4 px-2 text-left">{item.description}</td>
                                    <td className="py-4 px-2 text-center">{item.quantity}</td>
                                    <td className="py-4 px-2 text-right">₹{item.price.toLocaleString()}</td>
                                    <td className="py-4 px-2 text-right text-red-600">
                                        {item.discount ? `-₹${item.discount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="py-4 px-2 text-right font-medium">₹{((item.price * item.quantity) - (item.discount || 0)).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mt-8">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">₹{Number(order.totalAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{Number(order.balanceAmount) === 0 ? "Paid Amount:" : "Advance:"}</span>
                            <span className="font-medium">- ₹{(Number(order.totalAmount) - Number(order.balanceAmount)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-black pt-3">
                            <span>Balance Due:</span>
                            <span>₹{Number(order.balanceAmount).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t text-center text-sm text-gray-500">
                    <p>Thank you for choosing Bobiz Designer Studio.</p>
                    <p className="mt-1 text-xs">For questions concerning this invoice, please contact us.</p>
                </div>
            </div>
        </div>
    );
}
