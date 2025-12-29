import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Source = { title: string; url: string };

type Brief = {
  query: string;
  constraints: string;
  topPick: { name: string; why: string; tradeoff: string };
  columns: string[];
  columnHelp: string[];
  rows: { name: string; values: string[]; notes: string }[];
  sources: Source[];
  _mode?: string;
};

function sanitizeColumns(cols: unknown): string[] {
  const arr = Array.isArray(cols) ? cols : [];
  const clean = arr
    .slice(0, 5)
    .map((c) => String(c ?? "").trim())
    .map((c, i) => c || `Column ${i + 1}`);
  while (clean.length < 5) clean.push(`Column ${clean.length + 1}`);
  return clean;
}

function makeDemoBrief(query: string, constraints: string, columns: string[]): Brief {
  const q = query.toLowerCase();

  const isPhonePlan = q.includes("phone plan") || q.includes("carrier") || q.includes("sim");
  const isHeadphones = q.includes("headphone") || q.includes("earbuds") || q.includes("anc");

  const items = isPhonePlan
    ? [
        {
          name: "Mint Mobile (Demo)",
          values: ["$15–$30/mo", "5–20GB", "Limited", "Yes", "Best value prepaid"],
          notes: "Budget-friendly if coverage fits your area.",
        },
        {
          name: "Visible (Demo)",
          values: ["$25–$45/mo", "Unlimited", "Limited", "Yes", "Verizon network"],
          notes: "Simple unlimited pricing, good coverage in many areas.",
        },
        {
          name: "T-Mobile Prepaid (Demo)",
          values: ["$40–$60/mo", "Unlimited", "Add-on", "Yes", "Intl add-ons"],
          notes: "Good for international students; check promos.",
        },
      ]
    : isHeadphones
    ? [
        {
          name: "Sony WH-1000XM (Demo)",
          values: ["$250–$400", "Strong ANC", "Great", "Long", "Comfortable"],
          notes: "Balanced pick for calls + noise cancelling.",
        },
        {
          name: "Bose QC (Demo)",
          values: ["$250–$380", "Strong ANC", "Good", "Long", "Very comfy"],
          notes: "Comfort-first pick; call quality varies by model.",
        },
        {
          name: "Anker Soundcore (Demo)",
          values: ["$60–$150", "Good ANC", "Okay", "Long", "Budget"],
          notes: "Great value, fewer premium features.",
        },
      ]
    : [
        {
          name: "Option A (Demo)",
          values: ["Mid", "High", "Good", "Yes", "Simple choice"],
          notes: "Solid baseline option.",
        },
        {
          name: "Option B (Demo)",
          values: ["Low", "Medium", "Okay", "Yes", "Budget"],
          notes: "Cheapest, fewer premium features.",
        },
        {
          name: "Option C (Demo)",
          values: ["High", "High", "Great", "Yes", "Premium"],
          notes: "Best performance, costs more.",
        },
      ];

  return {
    query,
    constraints: constraints || "None",
    topPick: {
      name: items[0].name,
      why: "Demo result to showcase how ClearPick structures a comparison grid.",
      tradeoff: "Live sources + real links appear when API mode is enabled later.",
    },
    columns,
    columnHelp: [
      "Quick comparison 기준",
      "핵심 기능/품질",
      "누구에게 좋은지",
      "호환/제약",
      "추가 메모",
    ].slice(0, columns.length),
    rows: items.map((r) => ({
      name: r.name,
      values: r.values.slice(0, columns.length),
      notes: r.notes,
    })),
    sources: [],
    _mode: "demo_forced",
  };
}

export async function POST(req: Request) {
  // ✅ 어떤 경우에도 반드시 Response를 return 하도록 "단순 구조"로 작성
  try {
    const body = await req.json().catch(() => ({} as any));

    const query = String((body as any)?.query ?? "").trim();
    const constraints = String((body as any)?.constraints ?? "").trim();
    const columns = sanitizeColumns((body as any)?.columns);

    const finalQuery = query || "example: best noise cancelling headphones for calls";
    const demo = makeDemoBrief(finalQuery, constraints, columns);

    return NextResponse.json(demo, { status: 200 });
  } catch {
    const demo = makeDemoBrief(
      "example: best noise cancelling headphones for calls",
      "None",
      ["Price", "Key feature", "Best for", "Downside", "Notes"]
    );
    return NextResponse.json({ ...demo, _mode: "demo_catch_all" }, { status: 200 });
  }
}