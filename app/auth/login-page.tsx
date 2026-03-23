import { routes } from "../routes";

export function LoginPage() {
  return ({formAction, error}: {
    formAction: string
    error: string | null
  }) => {
    return (
      <main class="h-dvh">
							{error && typeof error === "string" ? <div class="text-red-500">{error}</div> : null}
							<form
								method="post"
								class="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center space-y-6 px-8"
								action={formAction}
							>
								<div class="w-full">
									<label htmlFor="email" class="block text-sm font-medium text-gray-700">
										Email address
									</label>
									<div class="mt-1">
										<input
											id="email"
											required
											autoFocus={true}
											name="email"
											type="email"
											autoComplete="email"
											class="w-full rounded border border-gray-500 px-2 py-1 text-lg"
										/>
									</div>
								</div>

								<div class="w-full">
									<label htmlFor="password" class="block text-sm font-medium text-gray-700">
										Password
									</label>
									<div class="mt-1">
										<input
											id="password"
											name="password"
											type="password"
											autoComplete="current-password"
											class="w-full rounded border border-gray-500 px-2 py-1 text-lg"
										/>
									</div>
								</div>

								<button
									type="submit"
									class="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
								>
									Log in
								</button>
								<div class="text-sm text-gray-500">
									Don&apos;t have an account?{" "}
									<a class="text-blue-500 underline" href={routes.auth.register.index.href()}>
										Sign up
									</a>
								</div>
							</form>
						</main>
    )
  }
}
