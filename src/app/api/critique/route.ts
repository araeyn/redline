import { GoogleGenerativeAI } from "@google/generative-ai";

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
      return Response.json({ error: "Missing Gemini server API key." }, { status: 500 });
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
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return Response.json([], { status: 200 });
    }

    const critiques = JSON.parse(match[0]);
    return Response.json(Array.isArray(critiques) ? critiques : [], { status: 200 });
  } catch (error) {
    console.error("Critique route failed:", error);
    return Response.json({ error: "Critique route failed." }, { status: 500 });
  }
}
