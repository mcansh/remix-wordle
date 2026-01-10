import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { useNonce } from "@mcansh/http-helmet/react";
import "./tailwind.css";

export function Layout({ children }: { children: React.ReactNode }) {
  const nonce = useNonce();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script src="https://cdn.usefathom.com/script.js" data-site="LHPWDAMW" defer />
      </head>
      <body className="h-screen">
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
