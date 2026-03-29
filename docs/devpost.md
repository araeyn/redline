## Inspiration

We kept coming back to the same problem: a lot of AI art tools are built around replacing the artist, but that is not what most artists actually need while they are working. The hard part is usually the middle of a piece, when the sketch is promising but something still feels off and you cannot tell if it is the lighting, the composition, the readability, or just one awkward area.

We wanted to build something that felt more like a mentor or art director than a generator. Instead of asking AI to make the art, we asked whether it could help artists make better decisions while they were still painting.

## What it does

Try Redline is an AI-assisted critique and iteration workspace for digital artists. You drop in a work-in-progress image, and it gives you a few different ways to understand what is working and what is not.

It can place critique markers directly on the canvas, simulate alternative lighting directions, break the image into larger structural masses, test whether the piece still reads at thumbnail size, and generate a plain-English next-pass plan. One of our favorite features is Focus Region: you can draw a box over one part of the artwork and run a local mentor pass just for that area instead of rerunning feedback on the entire piece.

The goal is not to finish the piece for the artist. The goal is to help them figure out what to fix next.

## How we built it

We built Try Redline with Next.js and React, with Framer Motion handling the interaction and animation work in the interface. The main workspace is a custom canvas-driven UI that supports critique overlays, region selection, image replacement, mirror check, value view, and interactive relighting.

For the critique side, we used Gemini through a server-side route so the API key stays private in deployment. On the visual side, we built our own lightweight image-analysis pipeline in the browser for features like relighting, readability testing, framing heatmaps, layer extraction, thumbnail previews, and local region analysis.

A lot of the project ended up being product design work as much as model work. We spent a lot of time making the tool feel understandable, fast, and useful to someone in the middle of making art.

## Challenges we ran into

The biggest challenge was getting the project to feel like a real tool instead of a pile of disconnected AI tricks. It was easy to add features. It was much harder to make them fit together in a way that felt coherent.

We also ran into a bunch of practical issues. Relighting initially looked too subtle, then too washed out, and then too soft, so we had to keep retuning it until the effect was clear without ruining detail. Handling different image shapes was another headache, especially tall images and landscape images competing with the surrounding layout. On top of that, we had to move critique generation behind a server route so the API key would not be exposed on Vercel, and we had to make the critique output more fault-tolerant when the model returned messy formatting.

## Accomplishments that we're proud of

We are proud that Try Redline ended up feeling like an actual creative workflow instead of a tech demo. The combination of full-image critique, localized region analysis, relighting, readability checks, and next-step planning makes it feel useful in a way that surprised even us by the end.

We are also proud of the positioning. This project does not treat AI as a substitute for artists. It treats AI as a support system for artists who are still learning, iterating, and making choices. That felt like a more interesting direction for this track, and honestly a more respectful one too.

On the technical side, we are happy that we got a polished multi-tool workspace running, kept the Gemini key private for deployment, and pushed the project to a point where it is strong enough to demo live without feeling fragile.

## What we learned

We learned that building a creative tool is as much about restraint as it is about capability. A feature can be impressive on its own and still make the product worse if it does not help the user make a decision. The best parts of Try Redline were the parts that reduced uncertainty for the artist.

We also learned how much presentation matters. Small choices in wording, layout, motion, and explanation completely changed whether a feature felt confusing or obvious. For a tool like this, trust is part of the product.

## What's next for Try Redline

The next step is making Try Redline more useful in day-to-day art workflows, not just in a hackathon demo. We want to support saved sessions, version-to-version comparison, better paintover guidance, and deeper region-based feedback. We also want to expand the critique system so it can adapt even better across different styles, from concept art and comics to environments and stylized illustration.

Longer term, we think Try Redline could become a real studio companion for independent artists and students: something you check before posting, before rendering, or before spending another two hours polishing the wrong thing.
