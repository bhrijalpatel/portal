"use client";

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
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export function ForgotPasswordForm() {
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
      <Card className="from-primary/5 bg-gradient-to-br via-blue-500/5 to-purple-500/5">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 space-y-2 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">
              If an account exists for{" "}
              <strong>{form.getValues("email")}</strong>, you will receive an
              email with instructions to reset your password.
            </p>
            <p className="text-muted-foreground text-xs">
              The link will expire in 1 hour for security reasons.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-center text-xs">
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
              className="text-primary text-sm hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="from-primary/5 bg-gradient-to-br via-blue-500/5 to-purple-500/5">
      <CardHeader className="text-center">
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
                  Sending Reset Link
                </>
              ) : (
                <>Send Reset Link</>
              )}
            </Button>

            <div className="space-y-2 text-center">
              <p className="text-muted-foreground text-sm">
                Remember your password?
              </p>
              <Link
                href="/sign-in"
                className="text-primary text-sm font-medium hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
