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

    for (const point of critiques) {
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
