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
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<
    "checking" | "valid" | "invalid"
  >("checking");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check for error in URL (invalid or expired token)
    if (error === "INVALID_TOKEN") {
      setTokenStatus("invalid");
      toast.error("Invalid or expired reset link. Please request a new one.");
    } else if (token) {
      setTokenStatus("valid");
    } else {
      setTokenStatus("invalid");
    }
  }, [token, error]);

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.newPassword,
        token,
      });

      if (error) {
        toast.error(error.message || "Failed to reset password");
        setIsLoading(false);
        return;
      }

      toast.success("Password reset successfully! Redirecting to sign in");

      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    } catch {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  }

  if (tokenStatus === "checking") {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <Card className="from-primary/5 bg-gradient-to-br via-blue-500/5 to-purple-500/5">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Invalid Reset Link</CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            Password reset links expire after 1 hour for security reasons.
          </p>
          <Button
            className="w-full"
            onClick={() => router.push("/forgot-password")}
          >
            Request New Reset Link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="from-primary/5 bg-gradient-to-br via-blue-500/5 to-purple-500/5">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset Your Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• At least 12 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Resetting Password
                </>
              ) : (
                <>Reset Password</>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
