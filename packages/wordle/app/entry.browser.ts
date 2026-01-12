import { createFrame } from "@remix-run/dom";

const frame = createFrame(document, {
  async loadModule(src, name) {
    const chunks = JSON.parse(src) as string[];
    const [mod] = await Promise.all(chunks.map((chunk) => import(/* @vite-ignore */ chunk)));
    return mod[name];
  },
  async resolveFrame(src) {
    const response = await fetch(new URL(src, location.href));
    return await response.text();
  },
});

await frame.ready();

console.log("[entry.browser] root frame ready.");
