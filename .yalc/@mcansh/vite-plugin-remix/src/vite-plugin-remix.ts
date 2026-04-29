// adapted from https://github.com/jacob-ebey/vite-plugin-remix/tree/a5f372a4d48f9545e94d60cc401b865031ceecd7z
// and https://github.com/markmals/remix-3-templates/blob/770cf11b7312304473462765fb4b3bbcfcb1358e/cloudflare/remix.plugin.ts

import fullstack from "@hiogawa/vite-plugin-fullstack";
import type { Program } from "@oxc-project/types";
import ts from "dedent";
import MagicString from "magic-string";
import type { EnvironmentOptions, PluginOption } from "vite";

const CLIENT_ENTRY_PATTERN = /\bclientEntry\b/;

export function remix({
  clientEntry = "app/entry.browser",
  serverEntry = "app/entry.server",
  serverEnvironments: _environments = ["ssr"],
  serverHandler = true,
}: {
  clientEntry?: string | false;
  serverEntry?: string;
  serverEnvironments?: string[];
  serverHandler?: boolean;
} = {}): PluginOption {
  const environments = new Set(_environments);
  const hasClientEntry = clientEntry !== false;
  const clientReferences = new Set<string>();

  return [
    fullstack({
      serverEnvironments: _environments,
      serverHandler,
    }),
    {
      name: "remix-build:compat",
      buildApp: {
        order: "pre",
        async handler(builder) {
          const originalBuild = builder.build.bind(builder);
          (builder as unknown as Record<string, unknown>).build = async (environment: unknown) => {
            if ((environment as { isBuilt?: boolean })?.isBuilt) return;
            return originalBuild(environment as Parameters<typeof builder.build>[0]);
          };

          const b = builder as typeof builder & {
            writeAssetsManifest?: () => Promise<void>;
          };
          const originalWrite = b.writeAssetsManifest;
          if (originalWrite) {
            b.writeAssetsManifest = async () => {
              try {
                await originalWrite();
              } catch (error) {
                if (
                  typeof error === "object" &&
                  error !== null &&
                  "code" in error &&
                  error.code !== "ENOENT"
                ) {
                  throw error;
                }
              }
            };
          }
        },
      },
    },
    {
      name: "remix-build",
      async buildApp(builder) {
        if (!builder.environments.ssr) {
          throw new Error("ssr environment not found");
        }

        if (hasClientEntry && !builder.environments.client) {
          throw new Error("client environment not found");
        }

        await builder.build(builder.environments.ssr);
        if (hasClientEntry && builder.environments.client) {
          await builder.build(builder.environments.client);
        }
      },
      config() {
        let environments: Record<string, EnvironmentOptions> = {
          ssr: {
            build: {
              outDir: "dist/ssr",
              rolldownOptions: {
                input: { index: serverEntry },
              },
            },
          },
        };

        if (hasClientEntry) {
          environments.client = {
            build: {
              outDir: "dist/client",
              rolldownOptions: {
                input: clientEntry,
              },
            },
          };
        }

        return {
          build: { assetsInlineLimit: 0 },
          environments
        };
      },
    },
    {
      name: "remix-preview-server",
      async configurePreviewServer(server) {
        const ssrOutDir = server.config.environments.ssr?.build?.outDir ?? "dist/ssr";
        const entryPath = `${ssrOutDir}/index.js`;

        let mod;
        try {
          mod = await import(/* @vite-ignore */ entryPath);
        } catch {
          return;
        }

        const router = mod.default ?? mod.router;
        const { createRequestListener } = await import("remix/node-fetch-server");

        return () => {
          server.middlewares.use(createRequestListener((request) => router.fetch(request)));
        };
      },
    },
    {
      name: "remix-suppress-abort-errors",
      configureServer(server) {
        return () => {
          server.middlewares.use(
            (error: unknown, _req: unknown, _res: unknown, next: (error?: unknown) => void) => {
              if (
                typeof error === "object" &&
                error !== null &&
                "message" in error &&
                error.message === "aborted"
              )
                return;
              next(error);
            },
          );
        };
      },
    },
    {
      name: "remix-client-entry-transform",
      transform(code, id) {
        if (!code.includes("import.meta.url")) return;
        if (!code.match(CLIENT_ENTRY_PATTERN)) return;

        const program = this.parse(code);
        const calls = findClientEntryCalls(program.body);
        if (calls.length === 0) return;

        const isServer = environments.has(this.environment.name);
        const ms = new MagicString(code);

        if (isServer) {
          const prepend = `import ___clientEntryAssets from "${id}?assets=client";\n`;
          ms.prepend(prepend);
          for (const call of [...calls].reverse()) {
            ms.overwrite(
              call.metaUrlStart,
              call.metaUrlEnd,
              `___clientEntryAssets.entry + "#${call.exportName}"`,
            );
          }
        } else {
          for (const call of [...calls].reverse()) {
            ms.overwrite(
              call.metaUrlStart,
              call.metaUrlEnd,
              `import.meta.url + "#${call.exportName}"`,
            );
          }
        }

        return {
          code: ms.toString(),
          map: ms.generateMap({ source: id }),
        };
      },
    },
    {
      name: "use-client-transform",
      transform(code, id) {
        if (!code.match(/\buse client\b/)) return;

        const program = this.parse(code);
        if (hasDirective(program.body, "use client")) {
          const ms = new MagicString(code);

          if (environments.has(this.environment.name)) {
            transformUseClient(ms, program, id, clientReferences);
          } else {
            removeUseClient(ms, program);
          }

          return {
            code: ms.toString(),
            map: ms.generateMap({ source: id }),
          };
        }
      },
    },
  ];
}

interface ClientEntryCall {
  exportName: string;
  metaUrlStart: number;
  metaUrlEnd: number;
}

function findClientEntryCalls(body: Program["body"]): ClientEntryCall[] {
  const results: ClientEntryCall[] = [];

  for (const node of body) {
    if (node.type !== "ExportNamedDeclaration") continue;
    if (node.declaration?.type !== "VariableDeclaration") continue;

    for (const declarator of node.declaration.declarations) {
      if (declarator.id.type !== "Identifier") continue;
      if (declarator.init?.type !== "CallExpression") continue;

      const call = declarator.init;

      if (call.callee.type !== "Identifier" || call.callee.name !== "clientEntry") continue;

      if (call.arguments.length < 2) continue;

      const firstArg = call.arguments[0]!;
      if (!firstArg) continue;
      if (firstArg.type !== "MemberExpression") continue;
      if (firstArg.object.type !== "MetaProperty") continue;
      if (firstArg.property.type !== "Identifier") continue;
      if (firstArg.property.name !== "url") continue;

      results.push({
        exportName: declarator.id.name,
        metaUrlStart: firstArg.start,
        metaUrlEnd: firstArg.end,
      });
    }
  }

  return results;
}

type Directive = { type: "ExpressionStatement"; directive?: string };
type ExportedFunction = {
  name: string;
  node: { declaration?: { start?: number } | null };
  start: number;
  end: number;
};

function hasDirective(body: Program["body"], directive: string): boolean {
  return body.some(
    (node) =>
      node.type === "ExpressionStatement" &&
      "directive" in node &&
      (node as Directive).directive === directive,
  );
}

function transformUseClient(
  ms: MagicString,
  program: Program,
  id: string,
  clientReferences: Set<string>,
) {
  if (!hasHydrateImport(program.body)) {
    addHydrateImport(ms);
  }

  let hasExports = false;
  for (const exportedFunction of getExportedFunctions(program.body)) {
    hasExports = true;
    removeExport(ms, exportedFunction);
    reExportAsHydrated(ms, exportedFunction, id);
  }
  if (hasExports) {
    clientReferences.add(id);
  }
}

function removeUseClient(ms: MagicString, program: Program) {
  for (const node of program.body) {
    if (
      node.type === "ExpressionStatement" &&
      "directive" in node &&
      node.directive === "use client"
    ) {
      ms.remove(node.start, node.end);
      break;
    }
  }
}

function getExportedFunctions(body: Program["body"]): ExportedFunction[] {
  const exportedFunctions: ExportedFunction[] = [];

  for (const node of body) {
    if (node.type !== "ExportNamedDeclaration") continue;
    if (!node.declaration) continue;

    if (node.declaration.type === "VariableDeclaration") {
      for (const declarator of node.declaration.declarations) {
        if (
          declarator.type === "VariableDeclarator" &&
          declarator.id.type === "Identifier" &&
          declarator.init?.type &&
          ["FunctionExpression", "ArrowFunctionExpression"].includes(declarator.init.type)
        ) {
          exportedFunctions.push({
            name: declarator.id.name,
            node: node,
            start: node.start,
            end: node.end,
          });
        }
      }
    } else if (node.declaration.type === "FunctionDeclaration") {
      exportedFunctions.push({
        name: node.declaration.id?.name || "",
        node: node,
        start: node.start,
        end: node.end,
      });
    }
  }

  return exportedFunctions;
}

function removeExport(ms: MagicString, exportedFunction: ExportedFunction) {
  ms.remove(
    exportedFunction.start,
    exportedFunction.node.declaration?.start ?? exportedFunction.start,
  );
}

function reExportAsHydrated(ms: MagicString, exportedFunction: ExportedFunction, id: string) {
  const functionName = exportedFunction.name;
  const hydratedName = `${functionName}Hydrated`;
  let assetsName = `___${functionName}Assets`;

  let hydratedExport = ts`
    import ___${functionName}Assets from "${id}?assets=client";

    let jsAssets = ${assetsName}.js.map(a => a.href);
    let assets = [${assetsName}.entry, ...jsAssets];

    let ___${functionName}AssetsDeduped = Array.from(new Set(assets));
    let ${hydratedName} = ___clientEntry(JSON.stringify(___${functionName}AssetsDeduped) + "#${functionName}", ${functionName});
    export { ${hydratedName} as ${functionName} };
  `;

  ms.append(hydratedExport);
}

function hasHydrateImport(body: Program["body"]) {
  return body.some((node) => {
    if (
      node.type === "ImportDeclaration" &&
      node.source.type === "Literal" &&
      node.source.value === "remix/ui"
    ) {
      return node.specifiers.some((spec) => {
        return (
          spec.type === "ImportSpecifier" &&
          spec.imported.type === "Identifier" &&
          spec.imported.name === "clientEntry"
        );
      });
    }
    return false;
  });
}

function addHydrateImport(ms: MagicString) {
  ms.prepend(
    `import { clientEntry as ___clientEntry } from "remix/ui";\n`
  );
}
