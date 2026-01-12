import { json, redirect, unstable_defineAction, unstable_defineLoader } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as React from "react";

import { loginSchema, verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect } from "~/utils";

export const loader = unstable_defineLoader(async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
});

export const action = unstable_defineAction(async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");
  const remember = formData.get("remember");

  const result = loginSchema.safeParse({ email, password });

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await verifyLogin(result.data.email, result.data.password);

  if (!user) {
    return json({ errors: { email: ["Invalid email or password"] } }, { status: 400 });
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: remember === "on" ? true : false,
    redirectTo,
  });
});

export const meta = () => {
  return [{ title: "Login" }];
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  const errors = React.useMemo(() => {
    return {
      email:
        actionData?.errors && "email" in actionData.errors ? actionData.errors.email : undefined,
      password:
        actionData?.errors && "password" in actionData.errors
          ? actionData.errors.password
          : undefined,
    };
  }, [actionData?.errors]);

  React.useEffect(() => {
    if (errors.email) {
      emailRef.current?.focus();
    } else if (errors.password) {
      passwordRef.current?.focus();
    }
  }, [errors]);

  return (
    <Form method="post" className="" noValidate>
      <div className="w-full">
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

      <div className="w-full">
        <label htmlFor="password" className="">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            ref={passwordRef}
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby="password-error"
            className=""
          />
          {errors.password ? (
            <div className="" id="password-error">
              {errors.password}
            </div>
          ) : null}
        </div>
      </div>

      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button type="submit" className="">
        Log in
      </button>
      <div className="">
        <div className="">
          <input id="remember" name="remember" type="checkbox" className="" />
          <label htmlFor="remember" className="">
            Remember me
          </label>
        </div>
        <div className="">
          Don&apos;t have an account?{" "}
          <Link
            className=""
            to={{
              pathname: "/join",
              search: searchParams.toString(),
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </Form>
  );
}
