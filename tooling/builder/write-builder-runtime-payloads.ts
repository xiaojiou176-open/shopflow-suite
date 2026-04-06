import { pathToFileURL } from 'node:url';
import {
  supportsCanonicalRuntimePayloads,
  writeCanonicalBuilderRuntimePayloads,
} from './runtime-payloads.ts';

function parseAppId(argv: string[]) {
  let appId = 'ext-albertsons';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--app') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --app');
      }
      appId = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return appId;
}

function main() {
  const appId = parseAppId(process.argv.slice(2));

  if (!supportsCanonicalRuntimePayloads(appId)) {
    throw new Error(
      `No current-scope runtime payload writer exists yet for ${appId}.`
    );
  }

  const result = writeCanonicalBuilderRuntimePayloads(appId);

  process.stdout.write(
    `Builder runtime payloads written for ${result.appId}: ${result.outputDirectory}\n`
  );
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main();
}
