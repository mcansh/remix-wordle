import { PassThrough } from "node:stream";
import crypto from "node:crypto";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import { Response } from "@remix-run/node";
import type { EntryContext, Headers } from "@remix-run/node";
import isbot from "isbot";
import { createSecureHeaders } from "@mcansh/http-helmet";

import { NonceProvider } from "./components/nonce";

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  let callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  let nonce = crypto.randomBytes(16).toString("base64");

  let secureHeaders = createSecureHeaders({
    "Content-Security-Policy": {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", `'nonce-${nonce}'`],
      // prettier-ignore
      connectSrc: process.env.NODE_ENV === "production" ? ["'self'"] : ["'self'", "ws:"],
    },
    "X-Frame-Options": "DENY",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Referrer-Policy": "same-origin",
    "Strict-Transport-Security": {
      maxAge: 60 * 60 * 24 * 365 * 2, // 2 years
      includeSubDomains: true,
      preload: true,
    },
    "X-Content-Type-Options": "nosniff",
    "X-DNS-Prefetch-Control": "on",
    "X-XSS-Protection": "1; mode=block",
  });

  for (let header of secureHeaders) {
    responseHeaders.set(...header);
  }

  return new Promise((resolve, reject) => {
    let didError = false;

    let { pipe, abort } = renderToPipeableStream(
      <NonceProvider nonce={nonce}>
        <RemixServer context={remixContext} url={request.url} />
      </NonceProvider>,
      {
        nonce,
        [callbackName]() {
          let body = new PassThrough();

          responseHeaders.set("Content-Type", "text/html");
          responseHeaders.set("Vary", "Cookie");

          resolve(
            new Response(body, {
              status: didError ? 500 : responseStatusCode,
              headers: responseHeaders,
            }),
          );
          pipe(body);
        },
        onShellError(err: unknown) {
          reject(err);
        },
        onError(error: unknown) {
          didError = true;
          console.error(error);
        },
      },
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
