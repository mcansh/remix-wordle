import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { RemixBrowser } from "@remix-run/react";

function mount() {
  React.startTransition(() => {
    ReactDOM.hydrateRoot(
      document,
      <React.StrictMode>
        <RemixBrowser />
      </React.StrictMode>
    );
  });
}

if (typeof window.requestIdleCallback === "function") {
  window.requestIdleCallback(mount);
} else {
  window.setTimeout(mount, 1);
}
