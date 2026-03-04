import path from 'node:path'
import fs from "fs";

// eslint-disable-next-line import/no-unresolved
import { loadConfig as loadConfigWithC12 } from "c12";
import { deepmerge } from "deepmerge-ts";

export const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.mjs', '.cjs', '.mts', '.cts'] as const satisfies string[]

export async function getSchemasPath(configRoot: string) {
    const {
      config,
      configFile: _resolvedPath,
    } = await loadConfigWithC12({
      cwd: configRoot,
      // configuration base name
      name: 'prisma',
      // do not load .env files
      dotenv: false,
      // do not load RC config
      rcFile: false,
      // do not extend remote config files
      giget: false,
      // do not extend the default config
      extend: false,
      // do not load from nearest package.json
      packageJson: false,

      // @ts-expect-error: this is a type-error in `c12` itself
      merger: deepmerge,

      jitiOptions: {
        interopDefault: true,
        moduleCache: false,
        extensions: SUPPORTED_EXTENSIONS,
      },
    })

    // Note: c12 apparently doesn't normalize paths on Windows, causing issues with Windows tests.
    const resolvedPath = _resolvedPath ? path.normalize(_resolvedPath) : undefined

  if (config.schema === undefined || resolvedPath === undefined) {
    const defPath1 = path.join(configRoot, "prisma/schema.prisma");
    if (fs.existsSync(defPath1)) {
      return defPath1;
    }

    const defPath2 = path.join(configRoot, "schema.prisma");
    if (fs.existsSync(defPath2)) {
      return defPath2;
    }

    throw new Error("Didn't find prisma schemas");
  }

  const splitPath = resolvedPath.split("/");
  splitPath.pop();

  return path.join(splitPath.join("/"), config.schema);
}
