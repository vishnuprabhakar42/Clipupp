"use client";

import { adminApi } from "@/lib/api/admin";
import { BulkActionBar } from "./BulkActionBar";

export function CouponsBulkBar() {
  return (
    <BulkActionBar<
      "DEACTIVATE" | "RESTORE" | "VERIFY" | "UNVERIFY" | "FEATURE" | "UNFEATURE"
    >
      selector='input[type=checkbox][data-bulk-scope="coupon"]'
      importHref="/admin/coupons/import"
      actions={[
        { value: "VERIFY", label: "Mark verified" },
        { value: "UNVERIFY", label: "Unmark verified" },
        { value: "FEATURE", label: "Feature" },
        { value: "UNFEATURE", label: "Unfeature" },
        {
          value: "DEACTIVATE",
          label: "Soft-delete",
          variant: "destructive",
          confirm: "Soft-delete {n} coupons? You can restore them later.",
        },
        { value: "RESTORE", label: "Restore" },
      ]}
      run={(action, ids) => adminApi.bulkCoupons(action, ids)}
    />
  );
}
