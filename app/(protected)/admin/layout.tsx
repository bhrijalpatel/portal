"use client";

import { redirect } from "next/navigation";
import { useRole } from "@/lib/role-context";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole } = useRole();

  useEffect(() => {
    if (userRole !== "admin") {
      redirect("/403");
    }
  }, [userRole]);

  if (userRole !== "admin") {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}
