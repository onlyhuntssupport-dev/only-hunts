import { redirect } from "next/navigation";

export default function DashboardInterceptor() {
  // If the system accidentally sends an admin here, 
  // instantly bounce them to the real Internal Team page.
  redirect("/admin");
}