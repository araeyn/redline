import { GoogleGenerativeAI } from "@google/generative-ai";

interface CritiquePoint {
  x: number;
  y: number;
  title: string;
  desc: string;
}

const fallbackCritiques: CritiquePoint[] = [
  { x: 24, y: 20, title: "Focal Hierarchy", desc: "This area competes too hard for attention. Push one clearer focal read and let nearby shapes simplify around it." },
  { x: 68, y: 28, title: "Value Grouping", desc: "The light and dark families fragment here. Merge neighboring values so the form reads faster from a distance." },
  { x: 58, y: 55, title: "Depth Cue", desc: "The layering feels flat in this region. Separate foreground and background with clearer overlap, scale change, or edge softness." },
  { x: 34, y: 76, title: "Shape Language", desc: "These forms repeat at a similar size and tempo. Vary the big-medium-small rhythm to make the design feel more intentional." },
  { x: 78, y: 74, title: "Lighting Logic", desc: "The lighting direction becomes ambiguous here. Unify the shadow path so surfaces respond to the same light source." },
];

const critiquePrompt = `
  You are a professional art director mentoring a digital artist.
  Analyze this work-in-progress image for its actual subject matter first.
  This may be a character drawing, creature, prop design, environment, vehicle, concept art sheet, abstract study, stylized illustration, comic panel, or non-figurative composition.
  Do not assume the image contains human anatomy.
  Only mention anatomy if a visible figure truly makes anatomy relevant.
  Prefer critique categories such as composition, silhouette, focal hierarchy, perspective, value grouping, material readability, edge control, lighting logic, color rhythm, shape language, storytelling clarity, spatial depth, and overall readability.
  Identify exactly 5-8 specific areas for improvement.
  Each note must point to a visible region in the image and give concise, actionable advice.
  Keep titles short and broadly applicable.
  Return the response as a JSON array of objects only.
  Format:
  [
    { "x": 40, "y": 25, "title": "Focal Hierarchy", "desc": "Critique text..." }
  ]
`;

function clampPoint(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(4, Math.min(96, parsed));
}

function normalizeCritiques(input: unknown): CritiquePoint[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const point = item as Record<string, unknown>;
      const title = typeof point.title === "string" ? point.title.trim() : "";
      const desc = typeof point.desc === "string" ? point.desc.trim() : "";
      if (!title || !desc) {
        return null;
      }

      return {
        x: clampPoint(point.x, fallbackCritiques[index % fallbackCritiques.length]?.x ?? 50),
        y: clampPoint(point.y, fallbackCritiques[index % fallbackCritiques.length]?.y ?? 50),
        title,
        desc,
      };
    })
    .filter((item): item is CritiquePoint => Boolean(item))
    .slice(0, 8);
}

function parseCritiques(text: string): CritiquePoint[] {
  const cleaned = text.replace(/```json|```/gi, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    const normalized = normalizeCritiques(parsed);
    if (normalized.length > 0) {
      return normalized;
    }
  } catch {}

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      const normalized = normalizeCritiques(parsed);
      if (normalized.length > 0) {
        return normalized;
      }
    } catch {}
  }

  const objectMatches = cleaned.match(/\{[\s\S]*?\}/g) ?? [];
  const parsedObjects = objectMatches
    .map((match) => {
      try {
        return JSON.parse(match);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const normalizedObjects = normalizeCritiques(parsedObjects);
  if (normalizedObjects.length > 0) {
    return normalizedObjects;
  }

  return [];
}

export async function POST(request: Request) {
  try {
    const { data, mimeType } = (await request.json()) as {
      data?: string;
      mimeType?: string;
    };

    if (!data) {
      return Response.json({ error: "Missing image payload." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("Missing Gemini server API key. Returning fallback critiques.");
      return Response.json(fallbackCritiques, { status: 200 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent([
      {
        inlineData: {
          data,
          mimeType: mimeType || "image/png",
        },
      },
      critiquePrompt,
    ]);

    const text = result.response.text();
    const critiques = parseCritiques(text);
    if (critiques.length === 0) {
      console.warn("Gemini returned unparseable critique output. Returning fallback critiques.");
      return Response.json(fallbackCritiques, { status: 200 });
    }

    return Response.json(critiques, { status: 200 });
  } catch (error) {
    console.error("Critique route failed:", error);
    return Response.json(fallbackCritiques, { status: 200 });
  }
}
