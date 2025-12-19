import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { User, InsertUser, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, Trash2, UserPlus, ShieldAlert, ArrowLeft, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";

export default function Users() {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [open, setOpen] = useState(false);

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    // Dynamic schema: Password is optional when editing
    const schema = editingUser
        ? insertUserSchema.extend({ password: insertUserSchema.shape.password.optional().or(z.literal('')) })
        : insertUserSchema;

    const form = useForm<InsertUser>({
        resolver: zodResolver(schema),
        defaultValues: {
            username: "",
            password: "",
            role: "staff",
        },
    });

    const createUserMutation = useMutation({
        mutationFn: async (data: InsertUser) => {
            const res = await apiRequest("POST", "/api/users", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            setOpen(false);
            setEditingUser(null);
            form.reset();
            toast({
                title: "User created",
                description: "The new user has been successfully added.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to create user",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async (data: InsertUser & { id: number }) => {
            const { id, ...updates } = data;
            const res = await apiRequest("PATCH", `/api/users/${id}`, updates);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            setOpen(false);
            setEditingUser(null);
            form.reset();
            toast({
                title: "User updated",
                description: "The user account has been updated.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to update user",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({
                title: "User deleted",
                description: "The user has been removed.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to delete user",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: InsertUser) => {
        if (editingUser) {
            updateUserMutation.mutate({ ...data, id: editingUser.id });
        } else {
            createUserMutation.mutate(data);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        form.reset({
            username: user.username,
            password: "", // Always reset password logic field
            role: user.role as "admin" | "manager" | "staff",
        });
        setOpen(true);
    };

    const handleAdd = () => {
        setEditingUser(null);
        form.reset({
            username: "",
            password: "",
            role: "staff",
        });
        setOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
        );
    }

    if (currentUser?.role !== "admin") {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground mt-2">Only Administrators can manage users.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center gap-2 mb-4">
                <Link href="/">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val);
                    if (!val) setEditingUser(null);
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAdd}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Username</Label>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Password {editingUser && "(Leave blank to keep current)"}</Label>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>Role</Label>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="staff">Staff</SelectItem>
                                                    <SelectItem value="manager">Manager</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            setOpen(false);
                                            setEditingUser(null);
                                            form.reset();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button2 type="submit" className="w-full" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                                        {(createUserMutation.isPending || updateUserMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingUser ? "Update User" : "Create Account"}
                                    </Button2>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.id}</TableCell>
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize
                    ${user.role === 'admin' ? 'bg-primary/10 text-primary' :
                                            user.role === 'manager' ? 'bg-orange-100 text-orange-800' :
                                                'bg-slate-100 text-slate-800'}`}>
                                        {user.role}
                                    </span>
                                </TableCell>
                                <TableCell>{user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "-"}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(user)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {user.id !== currentUser?.id && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to delete this user?")) {
                                                        deleteUserMutation.mutate(user.id);
                                                    }
                                                }}
                                                disabled={deleteUserMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// Helper component to fix auto-import issue if Button isn't imported correctly or to wrap
function Button2(props: any) { return <Button {...props} /> }
