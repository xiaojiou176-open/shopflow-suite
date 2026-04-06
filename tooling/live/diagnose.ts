import {
  buildDiagnoseReport,
  buildPreflightReport,
  buildProbeReport,
  resolveShopflowLiveSessionConfig,
  writeLiveJsonArtifact,
  writeLiveTraceBundle,
} from './shared';

const config = resolveShopflowLiveSessionConfig(process.env);
const preflight = await buildPreflightReport(config);
const probe = await buildProbeReport(config);
const report = buildDiagnoseReport(config, preflight, probe);
const artifacts = writeLiveJsonArtifact(config, 'diagnose', report);
const traceBundle = await writeLiveTraceBundle(config, probe);

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
