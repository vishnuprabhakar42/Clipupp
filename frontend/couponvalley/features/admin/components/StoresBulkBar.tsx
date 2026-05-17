"use client";

import { adminApi } from "@/lib/api/admin";
import { BulkActionBar } from "./BulkActionBar";

export function StoresBulkBar() {
  return (
    <BulkActionBar<"DEACTIVATE" | "RESTORE" | "FEATURE" | "UNFEATURE">
      selector='input[type=checkbox][data-bulk-scope="store"]'
      actions={[
        { value: "FEATURE", label: "Feature" },
        { value: "UNFEATURE", label: "Unfeature" },
        {
          value: "DEACTIVATE",
          label: "Soft-delete",
          variant: "destructive",
          confirm: "Soft-delete {n} stores? You can restore them later.",
        },
        { value: "RESTORE", label: "Restore" },
      ]}
      run={(action, ids) => adminApi.bulkStores(action, ids)}
    />
  );
}
