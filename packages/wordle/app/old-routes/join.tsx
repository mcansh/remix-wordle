import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { json, redirect, unstable_defineAction, unstable_defineLoader } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as React from "react";

import type { JoinData } from "~/models/user.server";

import { createUser, joinSchema } from "~/models/user.server";
import { getUserId, createUserSession } from "~/session.server";
import { safeRedirect } from "~/utils";

export const loader = unstable_defineLoader(async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
});

export const action = unstable_defineAction(async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const username = formData.get("username");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  const result = joinSchema.safeParse({ email, password, username });

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const user = await createUser(result.data);

    return createUserSession({
      request,
      userId: user.id,
      remember: false,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const targets = error.meta?.target;

        if (Array.isArray(targets) && targets.length > 0) {
          const errors = targets.reduce<{ [key in keyof JoinData]?: string[] }>((acc, cur) => {
            return { ...acc, [cur]: [`This ${cur} is already in use.`] };
          }, {});

          return json({ errors }, { status: 400 });
        }

        throw error;
      }
    }
  }
});

export const meta = () => {
  return [{ title: "Sign Up" }];
};

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const usernameRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  const errors = React.useMemo(() => {
    return {
      email:
        actionData?.errors && "email" in actionData.errors ? actionData.errors.email : undefined,
      username:
        actionData?.errors && "username" in actionData.errors
          ? actionData.errors.username
          : undefined,
      password:
        actionData?.errors && "password" in actionData.errors
          ? actionData.errors.password
          : undefined,
    };
  }, [actionData?.errors]);

  React.useEffect(() => {
    if (errors.email) {
      emailRef.current?.focus();
    } else if (errors.username) {
      usernameRef.current?.focus();
    } else if (errors.password) {
      passwordRef.current?.focus();
    }
  }, [errors]);

  return (
    <Form method="post" className="" noValidate>
      <div>
        <label htmlFor="email" className="">
          Email address
        </label>
        <div className="mt-1">
          <input
            ref={emailRef}
            id="email"
            required
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={true}
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby="email-error"
            className=""
          />
          {errors.email && (
            <div className="" id="email-error">
              {errors.email}
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="username" className="">
          Username
        </label>
        <div className="mt-1">
          <input
            id="username"
            ref={usernameRef}
            name="username"
            type="text"
            autoComplete="username"
            aria-invalid={errors.username ? true : undefined}
            aria-describedby="username-error"
            className=""
          />
          {errors.username && (
            <div className="" id="username-error">
              {errors.username}
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            ref={passwordRef}
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby="password-error"
            className=""
          />
          {errors.password && (
            <div className="" id="password-error">
              {errors.password}
            </div>
          )}
        </div>
      </div>

      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button type="submit" className="">
        Create Account
      </button>
      <div className="">
        <div className="">
          Already have an account?{" "}
          <Link
            className=""
            to={{
              pathname: "/login",
              search: searchParams.toString(),
            }}
          >
            Log in
          </Link>
        </div>
      </div>
    </Form>
  );
}
