import { formatFindings, scanCurrentSurface } from './sensitive-surface-gate';

const findings = scanCurrentSurface();

if (findings.length > 0) {
  console.error(formatFindings(findings, 'Sensitive surface gate'));
  process.exit(1);
}

process.stdout.write('Sensitive surface gate: no findings\n');
