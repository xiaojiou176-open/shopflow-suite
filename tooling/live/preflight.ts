import { buildPreflightReport, resolveShopflowLiveSessionConfig, writeLiveJsonArtifact } from './shared';

const config = resolveShopflowLiveSessionConfig(process.env);
const report = await buildPreflightReport(config);
const artifacts = writeLiveJsonArtifact(config, 'preflight', report);

process.stdout.write(
  `${JSON.stringify(
    {
      ...report,
      artifacts,
    },
    null,
    2
  )}\n`
);

