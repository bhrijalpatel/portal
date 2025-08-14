import { revalidateTag } from "next/cache";

/**
 * Revalidate cached admin user data
 * Call this function whenever user data is modified
 */
export async function revalidateAdminUsers() {
  console.log("♻️ Revalidating admin users cache...");
  revalidateTag('admin-users');
}

/**
 * Revalidate all admin-related caches
 * Call this for major admin operations
 */
export async function revalidateAdminData() {
  console.log("♻️ Revalidating all admin cache...");
  revalidateTag('admin-users');
  // Add other admin cache tags here as needed
}