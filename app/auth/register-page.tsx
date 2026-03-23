import { routes } from "../routes";

export function RegisterPage() {
  return ({
    formAction,
  }: {
    formAction: string

  }) => {
    return (
      <main class="h-dvh">
							<form
								method="POST"
								action={formAction}
								class="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center space-y-6 px-8"
							>
								<div class="w-full">
									<label class="block text-sm font-medium text-gray-700" for="email">
										Email address
									</label>
									<input
										type="email"
										id="email"
										name="email"
										required
										autoComplete="email"
										class="mt-1 w-full rounded border border-gray-500 px-2 py-1 text-lg"
									/>
								</div>

								<div class="w-full">
									<label class="block text-sm font-medium text-gray-700" for="username">
										Username
									</label>
									<input
										type="text"
										id="username"
										name="username"
										required
										autoComplete="username"
										class="mt-1 w-full rounded border border-gray-500 px-2 py-1 text-lg"
									/>
								</div>

								<div class="w-full">
									<label class="block text-sm font-medium text-gray-700" for="password">
										Password
									</label>
									<input
										type="password"
										id="password"
										name="password"
										required
										autoComplete="new-password"
										class="mt-1 w-full rounded border border-gray-500 px-2 py-1 text-lg"
									/>
								</div>

								<button
									type="submit"
									class="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
								>
									Join now
								</button>

								<p class="text-sm text-gray-500">
									Already have an account?{" "}
									<a href={routes.auth.login.index.href()} class="text-blue-500 underline">
										Login here
									</a>
								</p>
							</form>
						</main>
    )
  }
}
