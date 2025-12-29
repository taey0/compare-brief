import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const query = (body?.query ?? "").toString().trim();
    const constraints = (body?.constraints ?? "").toString().trim();

    const criteriaRaw = Array.isArray(body?.criteria) ? body.criteria : null;
    const criteria =
      criteriaRaw && criteriaRaw.every((x: any) => typeof x === "string")
        ? criteriaRaw.map((s: string) => s.trim()).filter(Boolean)
        : null;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const normalizedCriteria =
      criteria && criteria.length > 0
        ? (() => {
            const arr = [...criteria];
            while (arr.length < 5) arr.push("Unknown");
            return arr.slice(0, 5);
          })()
        : null;

    const variationHint = `Run id: ${Date.now()}`;

    const system = `
You are a practical product comparison assistant.
Return ONLY valid JSON (no markdown, no extra text).
All UI-facing strings must be English.
Prefer usefulness over hype.
If constraints conflict or are unrealistic, mention it briefly in notes or tradeoff.
If you are unsure, use "Unknown" rather than guessing.
`;

    const user = `
Create a "Compare Brief" for this query:
"${query}"

Constraints (must follow if possible):
"${constraints || "None"}"

User-selected criteria (if provided, use these as the columns exactly):
${normalizedCriteria ? JSON.stringify(normalizedCriteria) : "None"}

${variationHint}

Return JSON with this exact shape:
{
  "query": string,
  "constraints": string,
  "topPick": { "name": string, "why": string, "tradeoff": string },
  "columns": string[],
  "columnHelp": string[],
  "rows": [
    { "name": string, "values": string[], "notes": string }
  ],
  "sources": [
    { "title": string, "url": string }
  ]
}

Rules:
- Always: columns must be exactly 5 items.
- Always: columnHelp must be exactly 5 items, aligned with columns (same order).
- If user-selected criteria is provided:
  - columns MUST equal that criteria exactly (same order).
  - columnHelp must explain each provided column label.
- Otherwise:
  - columns: 5 short labels tailored to the query + constraints.
- rows: exactly 3 items.
- Each row.values length must equal columns length.
- Keep values short (e.g., "$199", "2.9 lb", "Strong", "Unknown").
- columnHelp: one short sentence each (why it matters).
- sources: 3–5 entries. If unsure, use https://example.com (do NOT invent specific claims).
`;

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: system.trim() },
        { role: "user", content: user.trim() },
      ],
    });

    const text = resp.choices[0]?.message?.content ?? "";

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: text },
        { status: 500 }
      );
    }

    // Normalize core fields
    if (typeof json?.query !== "string") json.query = query;
    if (typeof json?.constraints !== "string") json.constraints = constraints || "";

    // Ensure columns length 5
    if (!Array.isArray(json?.columns)) json.columns = [];
    json.columns = json.columns.map(String);
    while (json.columns.length < 5) json.columns.push("Unknown");
    json.columns = json.columns.slice(0, 5);

    // If criteria provided, enforce exact columns
    if (normalizedCriteria) {
      json.columns = normalizedCriteria;
    }

    // Ensure columnHelp length 5
    if (!Array.isArray(json?.columnHelp)) json.columnHelp = [];
    json.columnHelp = json.columnHelp.map(String);
    while (json.columnHelp.length < 5) json.columnHelp.push("Why it matters: Unknown");
    json.columnHelp = json.columnHelp.slice(0, 5);

    // Ensure rows values length = 5
    if (Array.isArray(json?.rows)) {
      json.rows = json.rows.map((r: any) => {
        const values = Array.isArray(r?.values) ? r.values.map(String) : [];
        while (values.length < 5) values.push("Unknown");
        return {
          name: String(r?.name ?? "Unknown"),
          values: values.slice(0, 5),
          notes: String(r?.notes ?? ""),
        };
      });
    }

    return NextResponse.json(json);
  } catch (err: any) {
    console.error("OPENAI ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}