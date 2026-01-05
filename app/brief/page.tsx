import { Suspense } from "react";
import BriefClient from "./BriefClient";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <BriefClient />
    </Suspense>
  );
}