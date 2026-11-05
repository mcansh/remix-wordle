import path from "node:path";
import { pathToFileURL } from "node:url";
import fullstack from "@hiogawa/vite-plugin-fullstack";
import ts from "dedent";
import MagicString from "magic-string";
const CLIENT_ENTRY_PATTERN = /\bclientEntry\b/;
function remix({
  clientEntry = "app/entry.browser",
  serverEntry = "app/entry.server",
  serverEnvironments: _environments = ["ssr"],
  serverHandler = true
} = {}) {
  const environments = new Set(_environments);
  const hasClientEntry = clientEntry !== false;
  const clientReferences = /* @__PURE__ */ new Set();
  return [
    fullstack({
      serverEnvironments: _environments,
      serverHandler
    }),
    {
      name: "remix-build:compat",
      buildApp: {
        order: "pre",
        async handler(builder) {
          const originalBuild = builder.build.bind(builder);
          builder.build = async (environment) => {
            if (environment?.isBuilt) return;
            return originalBuild(environment);
          };
          const b = builder;
          const originalWrite = b.writeAssetsManifest;
          if (originalWrite) {
            b.writeAssetsManifest = async () => {
              try {
                await originalWrite();
              } catch (error) {
                if (typeof error === "object" && error !== null && "code" in error && error.code !== "ENOENT") {
                  throw error;
                }
              }
            };
          }
        }
      }
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
        let environments2 = {
          ssr: {
            build: {
              outDir: "dist/ssr",
              rolldownOptions: {
                input: { index: serverEntry }
              }
            }
          }
        };
        if (hasClientEntry) {
          environments2.client = {
            build: {
              outDir: "dist/client",
              rolldownOptions: {
                input: clientEntry
              }
            }
          };
        }
        return {
          build: { assetsInlineLimit: 0 },
          environments: environments2
        };
      }
    },
    {
      name: "remix-preview-server",
      async configurePreviewServer(server) {
        const ssrOutDir = server.config.environments.ssr?.build?.outDir ?? "dist/ssr";
        const entryFile = path.isAbsolute(ssrOutDir) ? path.join(ssrOutDir, "index.js") : path.resolve(server.config.root, ssrOutDir, "index.js");
        const entryUrl = pathToFileURL(entryFile).href;
        let mod;
        try {
          mod = await import(
            /* @vite-ignore */
            entryUrl
          );
        } catch {
          return;
        }
        const router = mod.default ?? mod.router;
        const { createRequestListener } = await import("remix/node-fetch-server");
        return () => {
          server.middlewares.use(createRequestListener((request) => router.fetch(request)));
        };
      }
    },
    {
      name: "remix-suppress-abort-errors",
      configureServer(server) {
        return () => {
          server.middlewares.use(
            (error, _req, _res, next) => {
              if (typeof error === "object" && error !== null && "message" in error && error.message === "aborted")
                return;
              next(error);
            }
          );
        };
      }
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
          const prepend = `import ___clientEntryAssets from "${id}?assets=client";
`;
          ms.prepend(prepend);
          for (const call of [...calls].reverse()) {
            ms.overwrite(
              call.metaUrlStart,
              call.metaUrlEnd,
              `___clientEntryAssets.entry + "#${call.exportName}"`
            );
          }
        } else {
          for (const call of [...calls].reverse()) {
            ms.overwrite(
              call.metaUrlStart,
              call.metaUrlEnd,
              `import.meta.url + "#${call.exportName}"`
            );
          }
        }
        return {
          code: ms.toString(),
          map: ms.generateMap({ source: id })
        };
      }
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
            map: ms.generateMap({ source: id })
          };
        }
      }
    }
  ];
}
function findClientEntryCalls(body) {
  const results = [];
  for (const node of body) {
    if (node.type !== "ExportNamedDeclaration") continue;
    if (node.declaration?.type !== "VariableDeclaration") continue;
    for (const declarator of node.declaration.declarations) {
      if (declarator.id.type !== "Identifier") continue;
      if (declarator.init?.type !== "CallExpression") continue;
      const call = declarator.init;
      if (call.callee.type !== "Identifier" || call.callee.name !== "clientEntry") continue;
      if (call.arguments.length < 2) continue;
      const firstArg = call.arguments[0];
      if (!firstArg) continue;
      if (firstArg.type !== "MemberExpression") continue;
      if (firstArg.object.type !== "MetaProperty") continue;
      if (firstArg.property.type !== "Identifier") continue;
      if (firstArg.property.name !== "url") continue;
      results.push({
        exportName: declarator.id.name,
        metaUrlStart: firstArg.start,
        metaUrlEnd: firstArg.end
      });
    }
  }
  return results;
}
function hasDirective(body, directive) {
  return body.some(
    (node) => node.type === "ExpressionStatement" && "directive" in node && node.directive === directive
  );
}
function transformUseClient(ms, program, id, clientReferences) {
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
function removeUseClient(ms, program) {
  for (const node of program.body) {
    if (node.type === "ExpressionStatement" && "directive" in node && node.directive === "use client") {
      ms.remove(node.start, node.end);
      break;
    }
  }
}
function getExportedFunctions(body) {
  const exportedFunctions = [];
  for (const node of body) {
    if (node.type !== "ExportNamedDeclaration") continue;
    if (!node.declaration) continue;
    if (node.declaration.type === "VariableDeclaration") {
      for (const declarator of node.declaration.declarations) {
        if (declarator.type === "VariableDeclarator" && declarator.id.type === "Identifier" && declarator.init?.type && ["FunctionExpression", "ArrowFunctionExpression"].includes(declarator.init.type)) {
          exportedFunctions.push({
            name: declarator.id.name,
            node,
            start: node.start,
            end: node.end
          });
        }
      }
    } else if (node.declaration.type === "FunctionDeclaration") {
      exportedFunctions.push({
        name: node.declaration.id?.name || "",
        node,
        start: node.start,
        end: node.end
      });
    }
  }
  return exportedFunctions;
}
function removeExport(ms, exportedFunction) {
  ms.remove(
    exportedFunction.start,
    exportedFunction.node.declaration?.start ?? exportedFunction.start
  );
}
function reExportAsHydrated(ms, exportedFunction, id) {
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
function hasHydrateImport(body) {
  return body.some((node) => {
    if (node.type === "ImportDeclaration" && node.source.type === "Literal" && node.source.value === "remix/ui") {
      return node.specifiers.some((spec) => {
        return spec.type === "ImportSpecifier" && spec.imported.type === "Identifier" && spec.imported.name === "clientEntry";
      });
    }
    return false;
  });
}
function addHydrateImport(ms) {
  ms.prepend(
    `import { clientEntry as ___clientEntry } from "remix/ui";
`
  );
}
export {
  remix
};
