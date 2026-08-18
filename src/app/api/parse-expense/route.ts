import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { EXPENSE_CATEGORIES, CATEGORY_HINTS_ES } from "@/lib/categories";

const ParsedExpense = z.object({
  amount: z.number().nullable(),
  description: z.string(),
  category: z.enum(EXPENSE_CATEGORIES).nullable(),
  date: z.string().nullable(),
});

const client = new Anthropic();

function buildSystemPrompt(today: string): string {
  const categoryList = EXPENSE_CATEGORIES.map(
    (c) => `- ${c}: ${CATEGORY_HINTS_ES[c]}`,
  ).join("\n");

  return `Extraes UN gasto de una frase en español escrita por Fabrizio y devuelves JSON.

Hoy es ${today}. Si menciona una fecha relativa (ayer, el viernes pasado, anteayer) resuélvela a yyyy-MM-dd; si no menciona fecha, date: null.

amount: el monto como número. Entiende "5 dólares", "$5.50", "cinco dólares". Si no hay monto identificable, amount: null.

description: qué se compró, corto y capitalizado (ej. "Café").

Categorías disponibles (valor exacto en inglés: pistas en español):
${categoryList}

REGLA DURA SOBRE category — es la regla más importante:
Asigna category SOLO si el usuario NOMBRA EXPLÍCITAMENTE una categoría, es decir, si usa una palabra marcadora de categoría como "categoría", "cat", "en" seguida del nombre de la categoría (p. ej. categoría "entretenimiento", 'en transporte', 'cat comida', 'categoria supermercado'). Traduce esa categoría nombrada al valor EXACTO en inglés de la lista.
Si NO hay una categoría nombrada explícitamente, category: null. SIN EXCEPCIONES.
NUNCA deduzcas la categoría a partir de la descripción, del producto ni del contexto. El nombre de un producto NO es una categoría.
Ejemplos obligatorios:
- "café 5 dólares" → category: null (aunque exista Coffee/Snacks)
- "taxi 12.50" → category: null (aunque exista Transportation)
- "pan 3" → category: null (aunque exista Groceries)
- "compré agua 2 dólares" → category: null (aunque exista Groceries)
- "gasolina 40" → category: null (aunque exista Transportation)
- "cine 15 dólares" → category: null (aunque exista Entertainment)
- "café 5 dólares categoría entretenimiento" → category: "Entertainment"
- "taxi 12.50 en transporte" → category: "Transportation"
Ante la duda, category: null. Dejar category en null es SIEMPRE la respuesta correcta cuando el usuario no dijo la palabra de la categoría.`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Escribe el gasto que quieres registrar." },
      { status: 422 },
    );
  }

  const { text, today } = (body ?? {}) as { text?: unknown; today?: unknown };

  if (typeof text !== "string" || text.trim().length === 0) {
    return Response.json(
      { error: "Escribe el gasto que quieres registrar." },
      { status: 422 },
    );
  }

  const todayStr =
    typeof today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(today)
      ? today
      : new Date().toISOString().slice(0, 10);

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: buildSystemPrompt(todayStr),
      messages: [{ role: "user", content: text }],
      output_config: { format: zodOutputFormat(ParsedExpense) },
    });

    const parsed = response.parsed_output;

    if (!parsed) {
      return Response.json(
        { error: "No se pudo interpretar la respuesta." },
        { status: 500 },
      );
    }

    if (parsed.amount === null) {
      return Response.json(
        { error: "No pude identificar el monto." },
        { status: 422 },
      );
    }

    return Response.json({
      amount: parsed.amount,
      description: parsed.description,
      category: parsed.category,
      date: parsed.date ?? todayStr,
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json(
        { error: "Falta o es inválida la clave de API del servidor." },
        { status: 500 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: "Demasiadas solicitudes, intenta en unos segundos." },
        { status: 500 },
      );
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return Response.json(
        { error: "No se pudo conectar con el servicio de IA." },
        { status: 500 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return Response.json(
        { error: "Error del servicio de IA." },
        { status: 500 },
      );
    }
    return Response.json(
      { error: "No se pudo interpretar la respuesta." },
      { status: 500 },
    );
  }
}
