import fs from "node:fs";
import path from "node:path";
import pptxgen from "pptxgenjs";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "OpenAI Codex";
pptx.company = "Redline";
pptx.subject = "Viking Hacks 2026 pitch deck";
pptx.title = "Redline Pitch Deck";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};

const W = 13.333;
const H = 7.5;

const COLORS = {
  bg: "F5EEE5",
  paper: "FCF7F1",
  paperAlt: "F8F1E7",
  ink: "231713",
  muted: "71594B",
  line: "DDCBBB",
  red: "D83A23",
  redDeep: "82190F",
  dark: "2F211A",
};

function addBackground(slide) {
  slide.background = { color: COLORS.bg };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.18,
    y: 0.18,
    w: W - 0.36,
    h: H - 0.36,
    line: { color: COLORS.line, pt: 1 },
    fill: { color: COLORS.paper, transparency: 2 },
    radius: 0.22,
    shadow: {
      type: "outer",
      color: "8A5A3A",
      blur: 2,
      angle: 45,
      distance: 3,
      opacity: 0.12,
    },
  });
}

function addFooter(slide, page, label) {
  slide.addText(`Slide ${page}`, {
    x: 0.45,
    y: 7.0,
    w: 1.2,
    h: 0.2,
    fontFace: "Aptos",
    fontSize: 9,
    color: COLORS.muted,
    bold: true,
    charSpace: 1.8,
  });
  slide.addText(label, {
    x: 10.25,
    y: 7.0,
    w: 2.55,
    h: 0.2,
    fontFace: "Aptos",
    fontSize: 9,
    color: COLORS.muted,
    bold: true,
    align: "right",
    charSpace: 1.4,
  });
}

function addKicker(slide, text, x = 0.6, y = 0.58) {
  slide.addShape(pptx.ShapeType.line, {
    x,
    y: y + 0.13,
    w: 0.42,
    h: 0,
    line: { color: COLORS.red, pt: 1.25 },
  });
  slide.addText(text, {
    x: x + 0.5,
    y,
    w: 3.6,
    h: 0.22,
    fontFace: "Aptos",
    fontSize: 10,
    color: COLORS.muted,
    bold: true,
    charSpace: 2.4,
  });
}

function addTitle(slide, text, x = 0.6, y = 1.0, w = 6.6, size = 28) {
  slide.addText(text, {
    x,
    y,
    w,
    h: 1.3,
    fontFace: "Georgia",
    fontSize: size,
    color: COLORS.ink,
    bold: true,
    italic: true,
    margin: 0,
    fit: "shrink",
  });
}

function addBody(slide, text, x, y, w, h, size = 20, color = COLORS.muted) {
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontFace: "Aptos",
    fontSize: size,
    color,
    breakLine: true,
    margin: 0,
    fit: "shrink",
  });
}

function addBullets(slide, items, x, y, w, h, size = 21, color = COLORS.ink) {
  const runs = items.map((item) => ({
    text: item,
    options: { bullet: { indent: 14 } },
  }));
  slide.addText(runs, {
    x,
    y,
    w,
    h,
    fontFace: "Aptos",
    fontSize: size,
    color,
    breakLine: true,
    paraSpaceAfterPt: 14,
    margin: 0,
    fit: "shrink",
  });
}

function addPanel(slide, { x, y, w, h, title, body, titleColor = COLORS.muted, fill = COLORS.paperAlt }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    line: { color: COLORS.line, pt: 1 },
    fill: { color: fill, transparency: 6 },
  });
  slide.addText(title, {
    x: x + 0.22,
    y: y + 0.18,
    w: w - 0.44,
    h: 0.18,
    fontFace: "Aptos",
    fontSize: 10,
    color: titleColor,
    bold: true,
    charSpace: 1.9,
  });
  slide.addText(body, {
    x: x + 0.22,
    y: y + 0.44,
    w: w - 0.44,
    h: h - 0.6,
    fontFace: "Aptos",
    fontSize: 18,
    color: COLORS.muted,
    breakLine: true,
    margin: 0,
    fit: "shrink",
  });
}

function addQuote(slide, text, x, y, w, h, size = 24) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    line: { color: "E8C7B6", pt: 1 },
    fill: { color: "FFF5EF" },
  });
  slide.addText(text, {
    x: x + 0.25,
    y: y + 0.24,
    w: w - 0.5,
    h: h - 0.45,
    fontFace: "Georgia",
    fontSize: size,
    color: COLORS.redDeep,
    italic: true,
    breakLine: true,
    margin: 0,
    fit: "shrink",
  });
}

function addFeatureCard(slide, { x, y, w, h, label, body }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.1,
    line: { color: COLORS.line, pt: 1 },
    fill: { color: COLORS.paperAlt, transparency: 5 },
  });
  slide.addText(label, {
    x: x + 0.16,
    y: y + 0.14,
    w: w - 0.32,
    h: 0.18,
    fontFace: "Aptos",
    fontSize: 10,
    color: COLORS.redDeep,
    bold: true,
    charSpace: 1.8,
  });
  slide.addText(body, {
    x: x + 0.16,
    y: y + 0.38,
    w: w - 0.32,
    h: h - 0.5,
    fontFace: "Aptos",
    fontSize: 15,
    color: COLORS.muted,
    breakLine: true,
    margin: 0,
    fit: "shrink",
  });
}

function addStep(slide, { x, y, w, h, num, text }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.09,
    line: { color: COLORS.line, pt: 1 },
    fill: { color: COLORS.paperAlt, transparency: 2 },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: x + 0.18,
    y: y + 0.12,
    w: 0.44,
    h: 0.44,
    line: { color: COLORS.dark, pt: 1 },
    fill: { color: COLORS.dark },
  });
  slide.addText(String(num), {
    x: x + 0.18,
    y: y + 0.18,
    w: 0.44,
    h: 0.16,
    fontFace: "Aptos",
    fontSize: 13,
    color: "FFF8F1",
    bold: true,
    align: "center",
    margin: 0,
  });
  slide.addText(text, {
    x: x + 0.75,
    y: y + 0.12,
    w: w - 0.92,
    h: h - 0.2,
    fontFace: "Aptos",
    fontSize: 16,
    color: COLORS.ink,
    margin: 0,
    fit: "shrink",
  });
}

function buildSlides() {
  let slide = pptx.addSlide();
  addBackground(slide);
  addKicker(slide, "Digital Media & Creativity");
  slide.addText("Red", {
    x: 0.6, y: 1.05, w: 2.6, h: 0.85, fontFace: "Georgia", fontSize: 40, bold: true, italic: true, color: COLORS.red, margin: 0,
  });
  slide.addText("line", {
    x: 2.47, y: 1.05, w: 2.2, h: 0.85, fontFace: "Georgia", fontSize: 40, bold: true, color: COLORS.ink, margin: 0,
  });
  addBody(slide, "An AI art director for works in progress that critiques composition, simulates lighting, stress-tests readability, and tells creators what to fix next.", 0.62, 2.02, 6.25, 1.25, 20);
  addQuote(slide, "We are not replacing artists. We are mentoring them in the messy middle of creation.", 0.62, 3.02, 5.9, 1.58, 24);
  addPanel(slide, { x: 7.15, y: 0.92, w: 5.35, h: 1.3, title: "Core idea", body: "AI as mentor, not generator" });
  addPanel(slide, { x: 7.15, y: 2.42, w: 5.35, h: 1.45, title: "Who it helps", body: "Digital artists, illustrators, concept artists, and students" });
  addPanel(slide, { x: 7.15, y: 4.08, w: 5.35, h: 1.72, title: "Why it matters", body: "Better artistic decisions before time gets wasted on bad renders" });
  addPanel(slide, { x: 7.15, y: 6.0, w: 5.35, h: 0.78, title: "Presenter cue", body: "Open strong: Redline helps artists improve their own work instead of generating a replacement for it.", fill: "FFF9F4" });
  addFooter(slide, 1, "Redline Pitch Deck");

  slide = pptx.addSlide();
  addBackground(slide);
  addKicker(slide, "The Problem");
  addTitle(slide, "Artists do not just need more generation. They need better direction.", 0.6, 0.95, 7.1, 25);
  addBullets(slide, [
    "Most AI art tools focus on replacing the creative process.",
    "The real pain point is the middle of a piece, when an artist is unsure what to fix.",
    "Feedback is often slow, vague, or disconnected from the artwork itself.",
    "Creators waste hours rendering before they know if the piece even reads.",
  ], 0.72, 2.0, 6.35, 3.85, 19);
  addPanel(slide, { x: 7.55, y: 1.25, w: 4.6, h: 1.55, title: "Big takeaway", body: "The hardest part of making art is not starting. It is deciding what to change while the piece is still unfinished." });
  addQuote(slide, "The messy middle is where artistic confidence breaks down.", 7.55, 3.15, 4.85, 1.35, 20);
  addPanel(slide, { x: 7.55, y: 4.85, w: 4.85, h: 1.45, title: "Pitch note", body: "Frame Redline as process support, not output automation." });
  addFooter(slide, 2, "The messy middle is underserved");

  slide = pptx.addSlide();
  addBackground(slide);
  addKicker(slide, "The Product");
  addTitle(slide, "Redline turns a WIP into an actionable mentor pass.", 0.6, 0.95, 7.1, 25);
  const cards = [
    ["Critique", "Places visual critique directly on the artwork instead of giving generic text feedback."],
    ["Relight", "Lets artists audition stronger lighting directions before repainting highlights and shadows by hand."],
    ["Readability", "Checks whether the idea still reads at thumbnail size using silhouette and edge simplification."],
    ["Focus Region", "Boxes one weak area and runs a localized mentor pass instead of reanalyzing the whole image."],
    ["Layers", "Breaks the image into structural masses so artists can see design instead of noise."],
    ["Next Pass Plan", "Converts diagnosis into concrete, prioritized revision steps the artist can actually follow."],
  ];
  let idx = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const [label, body] = cards[idx++];
      addFeatureCard(slide, { x: 0.62 + col * 3.26, y: 1.92 + row * 1.42, w: 3.02, h: 1.2, label, body });
    }
  }
  addPanel(slide, { x: 7.35, y: 1.55, w: 5.05, h: 1.8, title: "One sentence", body: "Redline behaves like a digital studio partner: diagnose, simulate, interpret, and guide." });
  addPanel(slide, { x: 7.35, y: 3.72, w: 5.05, h: 2.18, title: "Judge framing", body: "This is not a one-feature demo. It is a workflow tool built around how artists actually iterate, from whole-image direction to local problem solving." });
  addFooter(slide, 3, "Multiple tools, one workflow");

  slide = pptx.addSlide();
  addBackground(slide);
  addKicker(slide, "Differentiation");
  addTitle(slide, "This is not another AI art app. It is a decision engine for creators.", 0.6, 0.95, 7.2, 24);
  addPanel(slide, { x: 0.7, y: 2.0, w: 5.75, h: 3.5, title: "Typical AI art tools", body: "• Generate finished outputs\n• Encourage replacement\n• Give one-shot results\n• Focus on polish, not process", fill: "FAF2EA" });
  addPanel(slide, { x: 6.9, y: 2.0, w: 5.75, h: 3.5, title: "Redline", body: "• Improves the artist's own WIP\n• Keeps the creator in control\n• Builds a feedback loop\n• Supports artistic judgment in real time", titleColor: COLORS.redDeep, fill: "FFF6F0" });
  addQuote(slide, "The uncommon move is not automating creation. It is augmenting creative judgment.", 1.15, 5.95, 11.0, 0.95, 18);
  addFooter(slide, 4, "Why this is memorable");

  slide = pptx.addSlide();
  addBackground(slide);
  addKicker(slide, "Demo Flow");
  addTitle(slide, "A 45-second demo judges can follow instantly.", 0.6, 0.95, 6.7, 25);
  [
    "Drop in a work-in-progress sketch or painting.",
    "Run Full Mentor Pass to generate critique, readability, structure, and planning.",
    "Open Relight and drag the sun to show visible lighting changes.",
    "Open Readability and show the silhouette plus thumbnail ladder.",
    "Box one weak area with Focus Region and run a local mentor pass.",
  ].forEach((text, i) => addStep(slide, { x: 0.72, y: 1.92 + i * 0.86, w: 6.65, h: 0.68, num: i + 1, text }));
  addPanel(slide, { x: 7.75, y: 1.85, w: 4.55, h: 1.45, title: "Demo goal", body: "Prove three things fast: it is useful, it is interactive, and it goes deeper than a single model call." });
  addPanel(slide, { x: 7.75, y: 3.55, w: 4.55, h: 1.85, title: "If time is short", body: "Prioritize Full Mentor Pass, Relight, and Focus Region. That sequence sells both UX and technical depth." });
  addFooter(slide, 5, "Show, do not tell");

  slide = pptx.addSlide();
  addBackground(slide);
  addKicker(slide, "Adoption");
  addTitle(slide, "Why artists would actually use it", 0.6, 0.95, 6.2, 27);
  addBullets(slide, [
    "It catches weak composition before hours of rendering are lost.",
    "It tests lighting directions without repainting from scratch.",
    "It checks whether the piece works at small sizes for thumbnails, portfolios, and social media.",
    "It gives plain-English next steps instead of vague critique.",
    "It works across characters, environments, props, stylized pieces, and more.",
  ], 0.72, 1.95, 6.5, 4.3, 18);
  addPanel(slide, { x: 7.55, y: 1.65, w: 4.8, h: 1.45, title: "Best use moment", body: "Before final render" });
  addPanel(slide, { x: 7.55, y: 3.35, w: 4.8, h: 1.65, title: "Best use habit", body: "A quick checkpoint between painting passes" });
  addPanel(slide, { x: 7.55, y: 5.3, w: 4.8, h: 1.1, title: "Judge cue", body: "Useful before posting, before paintover, and before final render." });
  addFooter(slide, 6, "Practical value");

  slide = pptx.addSlide();
  addBackground(slide);
  addKicker(slide, "Technical Depth");
  addTitle(slide, "More than a wrapper. Redline combines interactive analysis with private AI critique.", 0.6, 0.95, 7.0, 23);
  addBullets(slide, [
    "Client-side vision passes power relighting, structural layers, framing, and readability tests.",
    "Focus Region enables local mentor passes on just one selected part of the artwork.",
    "Critique runs through a server-side route so the Gemini API key stays private.",
    "The workspace adapts to portrait and landscape art and supports real-time interactions.",
  ], 0.72, 2.0, 6.55, 3.9, 18);
  addPanel(slide, { x: 7.45, y: 1.85, w: 4.9, h: 2.2, title: "Engineering story", body: "This feels like a product because it combines multiple visual models, interaction design, caching, region selection, and server-side critique orchestration." });
  addQuote(slide, "It is not only a prompt. It is a full creative analysis system with UI and systems work behind it.", 7.45, 4.45, 4.9, 1.45, 18);
  addFooter(slide, 7, "Built, not mocked");

  slide = pptx.addSlide();
  addBackground(slide);
  addKicker(slide, "Track Fit");
  addTitle(slide, "Redline directly matches the Digital Media & Creativity track.", 0.6, 0.95, 7.1, 25);
  addBullets(slide, [
    "Creator-first: built specifically for art creation and iteration.",
    "Innovative: uses AI as mentor rather than as replacement.",
    "Useful: gives actions, not just observations.",
    "Usable: fast, visual, interactive, and understandable for artists and non-artists.",
  ], 0.72, 2.0, 6.5, 3.85, 19);
  addQuote(slide, "Redline helps creators make stronger art, faster, while keeping the artist in control.", 7.2, 2.2, 5.0, 1.5, 21);
  addPanel(slide, { x: 7.2, y: 4.15, w: 5.0, h: 1.7, title: "Why it should win", body: "It answers the rubric directly: creator utility, uncommon approach, and strong user experience in one coherent product." });
  addFooter(slide, 8, "Why it should win");

  slide = pptx.addSlide();
  addBackground(slide);
  addKicker(slide, "Closing");
  addTitle(slide, "We did not ask AI to replace artists. We asked a better question.", 0.6, 0.95, 7.2, 24);
  addQuote(slide, "What if AI could mentor artists while they create?", 0.72, 2.35, 6.2, 1.4, 26);
  addPanel(slide, { x: 7.25, y: 1.85, w: 4.95, h: 1.5, title: "Redline is", body: "Your AI art director for the messy middle of creation" });
  addPanel(slide, { x: 7.25, y: 3.65, w: 4.95, h: 1.5, title: "Final message", body: "Better artistic decisions lead to better art." });
  addPanel(slide, { x: 0.72, y: 4.35, w: 6.15, h: 1.45, title: "Closing line", body: "Redline supports human creativity instead of bypassing it. That is the most memorable version of the project." });
  addFooter(slide, 9, "Thank you");
}

buildSlides();

const outDir = path.resolve("docs");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "Redline-Pitch-Deck.pptx");

await pptx.writeFile({ fileName: outPath });
console.log(`Wrote ${outPath}`);
