import { Suspense } from "react";
import BriefClient from "./BriefClient";

export default function BriefPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <BriefClient />
    </Suspense>
  );
}