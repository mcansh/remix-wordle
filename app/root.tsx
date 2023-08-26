import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import appStylesHref from "tailwindcss/tailwind.css";

import { useNonce } from "./components/nonce";

export let links: LinksFunction = () => {
  return [
    { rel: "preload", href: appStylesHref, as: "style" },
    { rel: "stylesheet", href: appStylesHref },
  ];
};

export default function App() {
  let nonce = useNonce();

  return (
    <html lang="en" className="h-screen">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-screen">
        <Outlet />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}
