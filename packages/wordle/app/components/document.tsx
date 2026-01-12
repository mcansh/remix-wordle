import type { Remix } from "@remix-run/dom";

import { mergeAssets } from "@jacob-ebey/vite-plugin-remix/runtime";

import appStylesHref from "../app.css?url";
import clientAssets from "../entry.browser.ts?assets=client";
import serverAssets from "../entry.server.tsx?assets=ssr";

export function Document({ children }: { children: Remix.RemixNode }) {
  const assets = mergeAssets(clientAssets, serverAssets);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href={appStylesHref} />
        {assets.css.map((attrs) => (
          <link key={attrs.href} {...attrs} rel="stylesheet" />
        ))}
        {assets.js.map((attrs) => (
          <link key={attrs.href} {...attrs} rel="modulepreload" />
        ))}
        <script async type="module" src={clientAssets.entry} />
        <script src="https://cdn.usefathom.com/script.js" data-site="LHPWDAMW" defer />
      </head>
      <body>{children}</body>
    </html>
  );
}
