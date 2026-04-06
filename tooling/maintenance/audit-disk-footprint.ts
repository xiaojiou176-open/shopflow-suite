import { buildDiskFootprintReport, formatDiskFootprintReport } from './disk-artifacts';

function main() {
  const report = buildDiskFootprintReport(process.cwd());

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  process.stdout.write(formatDiskFootprintReport(report));
}

main();
