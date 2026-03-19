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

  const { text, targetCalories, targetProtein, targetCarbs, targetFat, favoriteFoods, currentCalories, currentProtein, currentCarbs, currentFat } = body as {
    text?: string;
    targetCalories?: number;
    targetProtein?: number;
    targetCarbs?: number;
    targetFat?: number;
    favoriteFoods?: string[];
    currentCalories?: number;
    currentProtein?: number;
    currentCarbs?: number;
    currentFat?: number;
  };

  if (!text?.trim()) {
    return NextResponse.json({ error: "Zadej co jsi jedl." }, { status: 400 });
  }

  const favoritesContext = favoriteFoods && favoriteFoods.length > 0
    ? `\nUživatelova oblíbená jídla (můžeš je použít v návrzích):\n${favoriteFoods.map((f, i) => `${i + 1}. ${f}`).join("\n")}`
    : "";

  const tCal = targetCalories ?? 2500;
  const tPro = targetProtein ?? 150;
  const tCarb = targetCarbs;
  const tFat = targetFat;
  const cCal = currentCalories ?? 0;
  const cPro = currentProtein ?? 0;
  const cCarb = currentCarbs ?? 0;
  const cFat = currentFat ?? 0;

  const prompt = `Jsi fitness nutriční asistent. Odhadni makra pro toto jídlo:

"${text}"

Vrať POUZE čistý JSON objekt, bez markdown, bez backticks, bez komentářů:
{"calories":číslo,"protein":číslo,"carbs":číslo,"fat":číslo,"suggestions":"text"}

Pravidla pro makra:
- calories = kalorie tohoto jídla (číslo)
- protein = bílkoviny v gramech (číslo)
- carbs = sacharidy v gramech (číslo)
- fat = tuky v gramech (číslo)

Denní cíle uživatele:
- kalorie: ${tCal} kcal (dosud snědeno: ${cCal} kcal)
- bílkoviny: ${tPro} g (dosud: ${cPro} g)
${tCarb ? `- sacharidy: ${tCarb} g (dosud: ${cCarb} g)` : ""}
${tFat ? `- tuky: ${tFat} g (dosud: ${cFat} g)` : ""}
${favoritesContext}

Pravidla pro suggestions:
- Vypočítej kolik zbývá do cíle PO přidání tohoto jídla
- Pokud zbývá doplnit makra, navrhni VŽDY PŘESNĚ 3 možnosti jak doplnit zbývající makra
- Každá možnost musí být konkrétní jídlo nebo kombinace s přibližným množstvím
- Mix: aspoň 1 návrh z oblíbených uživatele, aspoň 1 obecný zdravý návrh
- Formát: "1. [jídlo] (~Xg bílkovin, ~Y kcal) 2. [jídlo] (~Xg bílkovin, ~Y kcal) 3. [jídlo] (~Xg bílkovin, ~Y kcal)"
- Pokud jsou všechny cíle splněny nebo překročeny, napiš "Denní cíle jsou splněny, výborně!"
- Piš česky, stručně

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
