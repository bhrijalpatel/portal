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
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { authClient } from "@/lib/auth-client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { email, z } from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

const formSchema = z.object({
  email: email().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("redirect") ?? "/dashboard";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Define a submit handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
        callbackURL: callbackURL, // Pass callback URL directly
      },
      {
        onRequest: () => {
          setIsLoading(true); // Show loading when request starts
        },
        onSuccess: () => {
          toast.success("Sign in successful");
          router.push(callbackURL);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message ?? "Sign in failed. Please try again.");
          setIsLoading(false);
        },
      },
    );
  }

  return (
    <Card className="from-primary/5 bg-gradient-to-br via-blue-500/5 to-purple-500/5">
      <CardHeader className="text-center">
        <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Enter your email and password to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Password
                          <Link
                            href="/forgot-password"
                            className="ml-auto text-xs hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex w-full justify-between gap-3">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Remember me</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="text-muted-foreground size-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Stay signed in on this device
                          </TooltipContent>
                        </Tooltip>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
