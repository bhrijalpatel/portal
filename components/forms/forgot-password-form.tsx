"use client";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsLoading(true);

    try {
      await authClient.forgetPassword({
        email: values.email,
        redirectTo: "/reset-password",
      });

      setIsSuccess(true);
      toast.success("Password reset email sent!");
    } catch {
      // Better Auth returns success even if email doesn't exist (security)
      // So we always show success message
      setIsSuccess(true);
      toast.success(
        "If an account exists, a password reset email has been sent.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div
        className={cn(
          "flex flex-col gap-6 w-full max-w-md p-8 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-emerald-500/5 to-teal-500/5 border border-emerald-500/10 backdrop-blur-sm shadow-lg",
          className,
        )}
        {...props}
      >
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="size-12 text-emerald-500 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent a password reset link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">
                If an account exists for{" "}
                <strong>{form.getValues("email")}</strong>, you will receive an
                email with instructions to reset your password.
              </p>
              <p className="text-xs text-muted-foreground">
                The link will expire in 1 hour for security reasons.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Didn&apos;t receive the email? Check your spam folder or
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSuccess(false);
                  form.reset();
                }}
              >
                Try Again
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/sign-in"
                className="text-sm text-primary hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6 w-full max-w-md p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-blue-500/5 to-purple-500/5 border border-primary/10 backdrop-blur-sm shadow-lg",
        className,
      )}
      {...props}
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="size-12 text-primary" />
          </div>
          <CardTitle className="text-xl">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail />
                    Send Reset Link
                  </>
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Remember your password?
                </p>
                <Link
                  href="/sign-in"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
