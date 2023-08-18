import * as React from "react";
import type { DataFunctionArgs, V2_MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { getUserId, createUserSession } from "~/session.server";
import type { JoinData } from "~/models/user.server";
import { createUser, joinSchema } from "~/models/user.server";
import { safeRedirect } from "~/utils";

export async function loader({ request }: DataFunctionArgs) {
  let userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }: DataFunctionArgs) {
  let formData = await request.formData();
  let email = formData.get("email");
  let username = formData.get("username");
  let password = formData.get("password");
  let redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  let result = joinSchema.safeParse({ email, password, username });

  if (!result.success) {
    return json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    let user = await createUser(result.data);

    return createUserSession({
      request,
      userId: user.id,
      remember: false,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        let targets = error.meta?.target;

        if (Array.isArray(targets) && targets.length > 0) {
          let errors = targets.reduce<{ [key in keyof JoinData]?: string[] }>(
            (acc, cur) => {
              return { ...acc, [cur]: [`This ${cur} is already in use.`] };
            },
            {},
          );

          return json({ errors }, { status: 400 });
        }

        throw error;
      }
    }
  }
}

export const meta: V2_MetaFunction = () => {
  return [{ title: "Sign Up" }];
};

export default function Join() {
  let [searchParams] = useSearchParams();
  let redirectTo = searchParams.get("redirectTo") ?? undefined;
  let actionData = useActionData<typeof action>();
  let emailRef = React.useRef<HTMLInputElement>(null);
  let usernameRef = React.useRef<HTMLInputElement>(null);
  let passwordRef = React.useRef<HTMLInputElement>(null);

  let errors = React.useMemo(() => {
    return {
      email:
        // @ts-expect-error
        actionData?.errors && "email" in actionData.errors
          ? // @ts-expect-error
            actionData.errors.email
          : undefined,
      username:
        // @ts-expect-error
        actionData?.errors && "username" in actionData.errors
          ? // @ts-expect-error
            actionData.errors.username
          : undefined,
      password:
        // @ts-expect-error
        actionData?.errors && "password" in actionData.errors
          ? // @ts-expect-error
            actionData.errors.password
          : undefined,
    };
    // @ts-expect-error
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
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                ref={emailRef}
                id="email"
                required
                autoFocus={true}
                name="email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby="email-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {errors.email && (
                <div className="pt-1 text-red-700" id="email-error">
                  {errors.email}
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
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
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {errors.username && (
                <div className="pt-1 text-red-700" id="username-error">
                  {errors.username}
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
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
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {errors.password && (
                <div className="pt-1 text-red-700" id="password-error">
                  {errors.password}
                </div>
              )}
            </div>
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Create Account
          </button>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                className="text-blue-500 underline"
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
      </div>
    </div>
  );
}
