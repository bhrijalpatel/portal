"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// Form schemas for different actions
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(12, "Password must be at least 12 characters"),
  role: z.enum(["user", "admin"]).default("user"),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum(["user", "admin"]),
});

const setPasswordSchema = z.object({
  newPassword: z.string().min(12, "Password must be at least 12 characters"),
});

const banUserSchema = z.object({
  banReason: z.string().min(1, "Ban reason is required"),
  banExpiresIn: z.string().optional(),
});

type ActionType =
  | "create"
  | "update"
  | "setPassword"
  | "ban"
  | "unban"
  | "delete"
  | "impersonate";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
}

interface UserActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: ActionType;
  user?: User;
  onSuccess: () => void;
}

export function UserActionsDialog({
  isOpen,
  onClose,
  action,
  user,
  onSuccess,
}: UserActionsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Create user form
  const createForm = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user" as const,
    },
  });

  // Update user form
  const updateForm = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user?.name || "",
      role: (user?.role as "user" | "admin") || "user",
    },
  });

  // Set password form
  const passwordForm = useForm({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  // Ban user form
  const banForm = useForm({
    resolver: zodResolver(banUserSchema),
    defaultValues: {
      banReason: "",
      banExpiresIn: "",
    },
  });

  // Reset update form when user changes
  useEffect(() => {
    if (user && action === "update") {
      updateForm.reset({
        name: user.name || "",
        role: (user.role as "user" | "admin") || "user",
      });
    }
  }, [user, action, updateForm]);

  const handleCreateUser = async (data: z.infer<typeof createUserSchema>) => {
    setIsLoading(true);
    try {
      await authClient.admin.createUser({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
      });

      toast.success("User created successfully", { id: 'create-user' });
      createForm.reset();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create user";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (data: z.infer<typeof updateUserSchema>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update role if it changed using Better Auth admin plugin
      if (data.role !== user.role) {
        await authClient.admin.setRole({
          userId: user.id,
          role: data.role,
        });
      }

      // Update name if it changed using our custom endpoint
      if (data.name !== user.name) {
        const response = await fetch("/api/admin/update-user", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            name: data.name,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update user name");
        }
      }

      toast.success("User updated successfully", { id: `update-user-${user.id}` });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update user";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (data: z.infer<typeof setPasswordSchema>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await authClient.admin.setUserPassword({
        userId: user.id,
        newPassword: data.newPassword,
      });
      toast.success("Password updated successfully", { id: `update-password-${user.id}` });
      passwordForm.reset();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : null) ||
          "Failed to update password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (data: z.infer<typeof banUserSchema>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await authClient.admin.banUser({
        userId: user.id,
        banReason: data.banReason,
        banExpiresIn: data.banExpiresIn
          ? parseInt(data.banExpiresIn) * 24 * 60 * 60
          : undefined, // Convert days to seconds
      });
      toast.success("User banned successfully", { id: `ban-user-${user.id}` });
      banForm.reset();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : null) || "Failed to ban user"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await authClient.admin.unbanUser({
        userId: user.id,
      });
      toast.success("User unbanned successfully", { id: `unban-user-${user.id}` });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : null) ||
          "Failed to unban user"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await authClient.admin.removeUser({
        userId: user.id,
      });
      toast.success("User deleted successfully", { id: `delete-user-${user.id}` });
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : null) ||
          "Failed to delete user"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonateUser = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await authClient.admin.impersonateUser({
        userId: user.id,
      });
      toast.success(`Now impersonating ${user.name || user.email}`, { id: `impersonate-${user.id}` });
      // Redirect to dashboard as the impersonated user
      window.location.href = "/dashboard";
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : null) ||
          "Failed to impersonate user"
      );
      setIsLoading(false);
    }
  };

  const getDialogContent = () => {
    switch (action) {
      case "create":
        return {
          title: "Create New User",
          description: "Add a new user to the system.",
          content: (
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(handleCreateUser)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter user's email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter user's password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
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
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="animate-spin" />}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ),
        };

      case "update":
        return {
          title: "Update User",
          description: `Update details for ${user?.name}.`,
          content: (
            <Form {...updateForm}>
              <form
                onSubmit={updateForm.handleSubmit(handleUpdateUser)}
                className="space-y-4"
              >
                <FormField
                  control={updateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
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
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Update User
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ),
        };

      case "setPassword":
        return {
          title: "Set Password",
          description: `Set a new password for ${user?.name}.`,
          content: (
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(handleSetPassword)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Set Password
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ),
        };

      case "ban":
        return {
          title: "Ban User",
          description: `Ban ${user?.name} from the system.`,
          content: (
            <Form {...banForm}>
              <form
                onSubmit={banForm.handleSubmit(handleBanUser)}
                className="space-y-4"
              >
                <FormField
                  control={banForm.control}
                  name="banReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ban Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter reason for ban"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={banForm.control}
                  name="banExpiresIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ban Duration (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Leave empty for permanent ban"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Ban User
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ),
        };

      case "unban":
        return {
          title: "Unban User",
          description: `Remove ban from ${user?.name}.`,
          content: (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will remove the ban and allow the user to sign in again.
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleUnbanUser} disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Unban User
                </Button>
              </DialogFooter>
            </div>
          ),
        };

      case "delete":
        return {
          title: "Delete User",
          description: `Permanently delete ${user?.name} from the system.`,
          content: (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete the
                user account and all associated data.
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteUser}
                  variant="destructive"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Delete User
                </Button>
              </DialogFooter>
            </div>
          ),
        };

      case "impersonate":
        return {
          title: "Impersonate User",
          description: `Sign in as ${user?.name}.`,
          content: (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will create a session as the selected user. The session
                will remain active for 1 hour or until you stop impersonating.
              </p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleImpersonateUser} disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Start Impersonation
                </Button>
              </DialogFooter>
            </div>
          ),
        };

      default:
        return {
          title: "Unknown Action",
          description: "This action is not supported.",
          content: null,
        };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only close if user explicitly closes the dialog, not on re-renders
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogContent.title}</DialogTitle>
          <DialogDescription>{dialogContent.description}</DialogDescription>
        </DialogHeader>
        {dialogContent.content}
      </DialogContent>
    </Dialog>
  );
}
