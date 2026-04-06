import {
  buildProbeReport,
  resolveShopflowLiveSessionConfig,
  writeLiveJsonArtifact,
  writeLiveTraceBundle,
} from './shared';

const config = resolveShopflowLiveSessionConfig(process.env);
const report = await buildProbeReport(config);
const artifacts = writeLiveJsonArtifact(config, 'probe', report);
const traceBundle = await writeLiveTraceBundle(config, report);

process.stdout.write(
  `${JSON.stringify(
    {
      ...report,
      artifacts,
      traceBundle,
    },
    null,
    2
  )}\n`
);
