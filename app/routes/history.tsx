import type { DataFunctionArgs, V2_MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import clsx from "clsx";

import { db } from "~/db.server";
import { requireUserId } from "~/session.server";

export let loader = async ({ request }: DataFunctionArgs) => {
  let userId = await requireUserId(request);

  let games = await db.userGame.findMany({
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

  let formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return json({
    games: games.map((game) => {
      let createdAt = new Date(game.createdAt);
      let updatedAt = new Date(game.updatedAt);
      let date = updatedAt > createdAt ? updatedAt : createdAt;
      return {
        id: game.id,
        date: formatter.format(date),
        guesses: game._count.guesses,
        status: game.status,
        word: game.word,
      };
    }),
  });
};

export let meta: V2_MetaFunction<typeof loader> = () => {
  return [{ title: "Remix Wordle" }];
};

export default function HistoryPage() {
  let data = useLoaderData<typeof loader>();

  return (
    <div className="px-4 pt-8 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            History
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A history of all of your games.
          </p>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full border-separate border-spacing-0 lg:px-6">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell"
                  >
                    Word
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
                  >
                    Guesses
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 py-3.5 pl-3 pr-4 backdrop-blur backdrop-filter sm:pr-6 lg:pr-8"
                  >
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.games.map((game, gameIndex, array) => (
                  <tr key={game.id}>
                    <td
                      className={clsx(
                        gameIndex !== array.length - 1
                          ? "border-b border-gray-200"
                          : "",
                        "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8",
                      )}
                    >
                      {game.date}
                    </td>
                    <td
                      className={clsx(
                        gameIndex !== array.length - 1
                          ? "border-b border-gray-200"
                          : "",
                        "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                      )}
                    >
                      {game.word.word}
                    </td>
                    <td
                      className={clsx(
                        gameIndex !== array.length - 1
                          ? "border-b border-gray-200"
                          : "",
                        "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                      )}
                    >
                      {game.guesses}
                    </td>
                    <td
                      className={clsx(
                        gameIndex !== array.length - 1
                          ? "border-b border-gray-200"
                          : "",
                        "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                      )}
                    >
                      {game.status}
                    </td>
                    <td
                      className={clsx(
                        gameIndex !== array.length - 1
                          ? "border-b border-gray-200"
                          : "",
                        "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-8 lg:pr-8",
                      )}
                    >
                      <Link
                        to={`/history/${game.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View<span className="sr-only">, {game.word.word}</span>
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
