import { json, unstable_defineLoader } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import clsx from "clsx";

import { db } from "~/db.server";
import { requireUserId } from "~/session.server";

export const loader = unstable_defineLoader(async ({ request }) => {
  const userId = await requireUserId(request);

  const games = await db.game.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { guesses: true } },
      status: true,
      word: true,
    },
  });

  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return json({
    games: games.map((game) => {
      const createdAt = new Date(game.createdAt);
      const updatedAt = new Date(game.updatedAt);
      const date = updatedAt > createdAt ? updatedAt : createdAt;
      return {
        id: game.id,
        date: formatter.format(date),
        guesses: game._count.guesses,
        status: game.status,
        word: game.word,
      };
    }),
  });
});

export const meta = () => {
  return [{ title: "Remix Wordle" }];
};

export default function HistoryPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="">
      <div className="">
        <div className="sm:flex-auto">
          <h1 className="">History</h1>
          <p className="">A history of all of your games.</p>
        </div>
      </div>
      <div className="">
        <div className="">
          <div className="">
            <table className="">
              <thead>
                <tr>
                  <th scope="col" className="">
                    Date
                  </th>
                  <th scope="col" className="">
                    Word
                  </th>
                  <th scope="col" className="">
                    Guesses
                  </th>
                  <th scope="col" className="">
                    Status
                  </th>
                  <th scope="col" className="">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.games.map((game, gameIndex, array) => (
                  <tr key={game.id}>
                    <td
                      className={clsx(
                        gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
                        "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8",
                      )}
                    >
                      {game.date}
                    </td>
                    <td
                      className={clsx(
                        gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
                        "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                      )}
                    >
                      {game.word}
                    </td>
                    <td
                      className={clsx(
                        gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
                        "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                      )}
                    >
                      {game.guesses}
                    </td>
                    <td
                      className={clsx(
                        gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
                        "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                      )}
                    >
                      {game.status}
                    </td>
                    <td
                      className={clsx(
                        gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
                        "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-8 lg:pr-8",
                      )}
                    >
                      <Link to={`/history/${game.id}`} className="">
                        View<span className="sr-only">, {game.word}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
