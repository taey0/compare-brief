import { Suspense } from "react";
import BriefClient from "./BriefClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <BriefClient />
    </Suspense>
  );
}