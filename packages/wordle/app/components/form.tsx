"use client";

import type { Remix } from "@remix-run/dom";

import { routes } from "../routes";

export function Form({
  currentGuess,
  children,
}: {
  currentGuess: number;
  children: Remix.RemixNode;
}) {
  return () => (
    <form
      method="post"
      action={routes.home.action.href(undefined, { cheat: true })}
      key={`current-guess-${currentGuess}`}
      className="grid grid-cols-5 gap-4"
      id="current-guess"
      autoComplete="off"
      // on={dom.change((event) => {
      //   const target = event.target;
      //   if (target instanceof HTMLInputElement) {
      //     if (target.value === "") return;
      //     if (target.nextElementSibling) {
      //       const nextInput = target.nextElementSibling;
      //       if (nextInput instanceof HTMLInputElement) {
      //         nextInput.select();
      //       }
      //     }
      //   }
      // })}
    >
      {children}
    </form>
  );
}
