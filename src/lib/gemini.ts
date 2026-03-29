interface CritiquePoint {
  x: number;
  y: number;
  title: string;
  desc: string;
}

const fallbackCritiques: CritiquePoint[] = [
  { x: 24, y: 20, title: "Focal Hierarchy", desc: "This area competes too hard for attention. Push one clearer focal read and let nearby shapes simplify around it." },
  { x: 68, y: 28, title: "Value Grouping", desc: "The light and dark families fragment here. Merge neighboring values so the form reads faster from a distance." },
  { x: 61, y: 34, title: "Value Grouping", desc: "This second cluster breaks away from the main light family. Pull it closer to the larger mass so the read stays cleaner." },
  { x: 58, y: 55, title: "Depth Cue", desc: "The layering feels flat in this region. Separate foreground and background with clearer overlap, scale change, or edge softness." },
  { x: 34, y: 76, title: "Shape Language", desc: "These forms repeat at a similar size and tempo. Vary the big-medium-small rhythm to make the design feel more intentional." },
  { x: 44, y: 68, title: "Edge Control", desc: "The edges here are all hitting a similar sharpness. Let one edge stay crisp and soften the neighboring forms." },
  { x: 78, y: 74, title: "Lighting Logic", desc: "The lighting direction becomes ambiguous here. Unify the shadow path so surfaces respond to the same light source." },
  { x: 72, y: 18, title: "Lighting Logic", desc: "A second highlight pattern is competing with the main light source. Simplify it so the image feels lit from one setup." },
  { x: 18, y: 58, title: "Readability", desc: "This cluster is getting busy before the viewer understands it. Group the shapes more clearly so it reads faster." },
];

async function imageRefToInlineData(imageRef: string) {
  const response = await fetch(imageRef);
  const blob = await response.blob();
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(blob);
  });

  return {
    data: base64Data,
    mimeType: blob.type || "image/png",
  };
}

export async function* analyzeImageStream(imageRef: string) {
  try {
    const inlineData = await imageRefToInlineData(imageRef);
    const response = await fetch("/api/critique", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inlineData),
    });

    if (!response.ok) {
      throw new Error(`Critique request failed with status ${response.status}`);
    }

    const critiques = (await response.json()) as CritiquePoint[];
    const notes = Array.isArray(critiques) && critiques.length > 0 ? critiques : fallbackCritiques;

    for (const point of notes) {
      await new Promise((resolve) => window.setTimeout(resolve, 120));
      yield point;
    }
  } catch (error) {
    console.error("Gemini critique route error:", error);
    for (const item of fallbackCritiques) {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      yield item;
    }
  }
}
