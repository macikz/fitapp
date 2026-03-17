import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

function extractJSON(raw: string): Record<string, unknown> | null {
  // Try direct parse first
  try {
    return JSON.parse(raw.trim());
  } catch {}

  // Strip markdown code fences
  const stripped = raw.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {}

  // Find first {...} block
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  return null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  const { text, targetCalories, targetProtein, targetCarbs, targetFat } = body as {
    text?: string;
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
  };

  if (!text?.trim()) {
    return NextResponse.json({ error: "Zadej co jsi jedl." }, { status: 400 });
  }

  const prompt = `Jsi fitness nutriční asistent. Odhadni makra pro toto jídlo:

"${text}"

Vrať POUZE čistý JSON objekt, bez markdown, bez backticks, bez komentářů, jen samotný JSON:
{"calories":číslo,"protein":číslo,"carbs":číslo,"fat":číslo,"suggestions":"text"}

Pravidla:
- calories = celkové kalorie (číslo)
- protein = bílkoviny v gramech (číslo)
- carbs = sacharidy v gramech (číslo)
- fat = tuky v gramech (číslo)
- suggestions = krátké doporučení v češtině co ještě sníst aby uživatel splnil denní cíle

Denní cíle uživatele:
- kalorie: ${targetCalories ?? 2500} kcal
- bílkoviny: ${targetProtein ?? 150} g
- sacharidy: ${targetCarbs ?? "nenastaveno"} g
- tuky: ${targetFat ?? "nenastaveno"} g

Odpověz POUZE JSON, nic jiného.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const data = extractJSON(raw);

    if (!data) {
      console.error("Failed to parse JSON from model response:", raw);
      return NextResponse.json(
        { error: "Model vrátil neočekávaný formát. Zkus to znovu." },
        { status: 500 }
      );
    }

    // Sanitize – ensure all numeric fields are numbers
    return NextResponse.json({
      calories: Number(data.calories) || 0,
      protein: Number(data.protein) || 0,
      carbs: Number(data.carbs) || 0,
      fat: Number(data.fat) || 0,
      suggestions: typeof data.suggestions === "string" ? data.suggestions : "",
    });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: "Nepodařilo se spojit s AI. Zkontroluj API klíč nebo zkus znovu." },
      { status: 500 }
    );
  }
}
