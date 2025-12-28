import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export default function AuthPage() {
    const { user, loginMutation } = useAuth();
    const [, setLocation] = useLocation();

    const form = useForm<Pick<InsertUser, "username" | "password">>({
        resolver: zodResolver(insertUserSchema.pick({ username: true, password: true })),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    useEffect(() => {
        if (user) {
            setLocation("/");
        }
    }, [user, setLocation]);

    const onLogin = (data: Pick<InsertUser, "username" | "password">) => {
        loginMutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Bobiz</CardTitle>
                    <p className="text-center text-muted-foreground text-sm">Sign in to your account</p>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Username</Label>
                                        <FormControl>
                                            <Input {...field} disabled={loginMutation.isPending} />
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
                                        <Label>Password</Label>
                                        <FormControl>
                                            <Input type="password" {...field} disabled={loginMutation.isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </form>
                    </Form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={() => {
                            const setGuestMode = useStore.getState().setGuestMode;
                            setGuestMode(true);
                            // Navigation happens automatically due to auth state change
                        }}
                    >
                        👀 Try Demo Mode (Guest)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
