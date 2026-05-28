import { AdminGridSkeleton } from "@/features/admin/components/AdminLoadingSkeleton";

// Dashboard skeleton — KPI tiles + chart + drill-downs.
export default function Loading() {
  return <AdminGridSkeleton tiles={9} />;
}
