import { Suspense } from "react";
import BriefClient from "./BriefClient";

export default function BriefPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading…</div>}>
      <BriefClient />
    </Suspense>
  );
}