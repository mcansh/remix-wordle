import { Document } from "../components/document"

export function GameNotFound() {
	return () => {
		return (
			<Document head={<title>Remix Wordle - Game Not Found</title>}>
				<div class="mx-auto h-full max-w-sm">
					<header>
						<h1 class="py-4 text-center text-4xl font-semibold">Remix Wordle</h1>
					</header>

					<main>
						<div class="">
							<h2 class="">Game Not Found</h2>
							<p class="">The game you are looking for does not exist.</p>
						</div>
					</main>
				</div>
			</Document>
		)
	}
}
