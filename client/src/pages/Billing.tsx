import { Layout } from "@/components/layout/Layout";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Trash2, Plus, Printer } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const orderSchema = z.object({
  clientName: z.string().min(2, "Name required"),
  phone: z.string().max(20, "Phone too long (max 20 chars)").optional(),
  orderDate: z.string().min(1, "Order date required"),
  dueDate: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Item description required"),
    quantity: z.coerce.number().min(1),
    price: z.coerce.number().min(0),
  })).min(1, "At least one item required"),
  advanceAmount: z.coerce.number().min(0),
  advanceMode: z.enum(["Cash", "UPI", "Bank"] as const),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function Billing() {
  const store = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientName: "",
      phone: "",
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      items: [{ description: "", quantity: 1, price: 0 }],
      advanceAmount: 0,
      advanceMode: "Cash",
      notes: ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const watchItems = form.watch("items");
  const totalAmount = watchItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const balanceAmount = totalAmount - (Number(form.watch("advanceAmount")) || 0);

  const onSubmit = async (data: OrderFormValues) => {
    try {
      const newOrder = await store.addOrder({
        orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
        clientName: data.clientName,
        phone: data.phone || "",
        items: data.items.map(i => ({ ...i, id: Math.random().toString() })),
        totalAmount,
        initialPayment: data.advanceAmount,
        initialPaymentMode: data.advanceMode,
        orderDate: data.orderDate,
        dueDate: data.dueDate || "",
        notes: data.notes
      });

      setCreatedOrderId(newOrder.id);
      toast({ title: "Order Created", description: "New order has been successfully generated." });
    } catch (error: any) {
      console.error("Order creation failed:", error);
      toast({
        title: "Error Creating Order",
        description: error.message || "Failed to create order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setCreatedOrderId(null);
    form.reset({
      clientName: "",
      phone: "",
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      items: [{ description: "", quantity: 1, price: 0 }],
      advanceAmount: 0,
      advanceMode: "Cash",
      notes: ""
    });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Order Billing</h2>
          <p className="text-muted-foreground">Create a new order and generate bill.</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Mobile Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Order Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ description: "", quantity: 1, price: 0 })}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? "sr-only" : ""}>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Item name" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? "sr-only" : ""}>Qty</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index !== 0 ? "sr-only" : ""}>Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value === 0 ? '' : field.value}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    field.onChange(val);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{totalAmount}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="advanceAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Advance Payment</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="text-right"
                              placeholder="0.00"
                              {...field}
                              value={field.value === 0 ? '' : field.value}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                field.onChange(val);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="advanceMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Mode</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                              <SelectItem value="Bank">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                    <span>Balance Due</span>
                    <span className="text-primary">₹{balanceAmount}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setLocation("/")} disabled={form.formState.isSubmitting}>Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Creating..." : "Create Order"}
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      {/* Success Dialog */}
      <Dialog open={!!createdOrderId} onOpenChange={(open) => !open && handleReset()}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-green-600" />
              Order Created Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <p className="text-muted-foreground">The order has been saved. What would you like to do next?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleReset}>New Order</Button>
              <Button onClick={() => window.open(`/print-bill/${createdOrderId}`, '_blank')} className="gap-2">
                <Printer className="w-4 h-4" /> Print Bill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
