import { pathToFileURL } from 'node:url';
import {
  closeShopflowLiveBrowser,
  readChromeProcessList,
  resolveShopflowLiveSessionConfig,
  writeLiveJsonArtifact,
} from './shared';

export {
  closeShopflowLiveBrowser,
  executeCloseLiveBrowserRecord as executeCloseLiveBrowser,
  requestBrowserCloseOverCdp,
  signalProcess,
  waitForProcessExit,
} from './shared';

export async function closeLiveBrowserMain() {
  const config = resolveShopflowLiveSessionConfig(process.env);
  const report = await closeShopflowLiveBrowser(config, readChromeProcessList());
  const artifacts = writeLiveJsonArtifact(config, 'close-live-browser', report);

  process.stdout.write(`${JSON.stringify({ ...report, artifacts }, null, 2)}\n`);

  if (report.blockers.length > 0) {
    process.exit(1);
  }
}

export function handleCloseLiveBrowserError(error: unknown) {
  const message =
    error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (process.argv[1]) {
  const entryUrl = pathToFileURL(process.argv[1]).href;
  if (import.meta.url === entryUrl) {
    closeLiveBrowserMain().catch(handleCloseLiveBrowserError);
  }
}
