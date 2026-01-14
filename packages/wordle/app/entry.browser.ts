import { createFrame } from "@remix-run/dom";

let frame = createFrame(document, {
  async loadModule(src, name) {
    let chunks = JSON.parse(src) as string[];
    let [mod] = await Promise.all(chunks.map((chunk) => import(/* @vite-ignore */ chunk)));
    return mod[name];
  },
  async resolveFrame(src) {
    let response = await fetch(new URL(src, location.href));
    return await response.text();
  },
});

await frame.ready();

console.log("[entry.browser] root frame ready.");
