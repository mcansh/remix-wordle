import type { Handle } from "remix/ui"

import { Document } from "#app/components/document.tsx"
import {
	LANDING_TITLE,
	ROBOTS_INDEX,
	SITE_DESCRIPTION,
	SITE_IMAGE_URL,
	SITE_JSON_LD,
	SITE_TITLE,
	SITE_URL,
	TOTAL_GUESSES,
	WORD_LENGTH,
} from "#app/constants.ts"
import { routes } from "#app/routes.ts"

export function LandingPage(handle: Handle<{ url: URL }>) {
	return () => {
		return (
			<Document
				url={handle.props.url}
				robots={ROBOTS_INDEX}
				canonical={SITE_URL}
				head={
					<>
						<title>{LANDING_TITLE}</title>
						<meta name="description" content={SITE_DESCRIPTION} />
						<meta property="og:type" content="website" />
						<meta property="og:site_name" content={SITE_TITLE} />
						<meta property="og:title" content={LANDING_TITLE} />
						<meta property="og:description" content={SITE_DESCRIPTION} />
						<meta property="og:url" content={SITE_URL} />
						<meta property="og:image" content={SITE_IMAGE_URL} />
						<meta property="og:locale" content="en" />
						<meta name="twitter:card" content="summary" />
						<meta name="twitter:title" content={LANDING_TITLE} />
						<meta name="twitter:description" content={SITE_DESCRIPTION} />
						<meta name="twitter:image" content={SITE_IMAGE_URL} />
						<script type="application/ld+json">{SITE_JSON_LD}</script>
					</>
				}
			>
				<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center space-y-6 px-8 py-12">
					<h1 class="text-center text-4xl font-semibold">{SITE_TITLE}</h1>
					<p class="text-center text-gray-700">{SITE_DESCRIPTION}</p>
					<section class="w-full space-y-3 text-gray-700" aria-labelledby="how-to-play">
						<h2 id="how-to-play" class="text-center text-lg font-medium text-gray-900">
							How to play
						</h2>
						<ul class="list-disc space-y-2 pl-5">
							<li>
								Each day has one {WORD_LENGTH}-letter puzzle. You have {TOTAL_GUESSES} guesses to
								find it.
							</li>
							<li>Green means a letter is in the word and in the right place.</li>
							<li>Yellow means a letter is in the word, but in a different place.</li>
							<li>Red means that letter is not in the word.</li>
						</ul>
					</section>
					<p class="text-center text-sm text-gray-500">
						Log in or create an account to play today&apos;s game and keep a history of your
						puzzles.
					</p>
					<div class="flex w-full flex-col gap-3 sm:flex-row">
						<a
							class="w-full rounded bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-600 focus:bg-blue-400"
							href={routes.auth.login.index.href()}
						>
							Log in
						</a>
						<a
							class="w-full rounded border border-gray-500 px-4 py-2 text-center text-gray-900 hover:bg-gray-50"
							href={routes.auth.register.index.href()}
						>
							Sign up
						</a>
					</div>
				</main>
			</Document>
		)
	}
}
