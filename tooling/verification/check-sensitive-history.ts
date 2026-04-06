import { formatFindings, scanGitHistory } from './sensitive-surface-gate';

const findings = scanGitHistory();

if (findings.length > 0) {
  console.error(formatFindings(findings, 'Sensitive history gate'));
  process.exit(1);
}

process.stdout.write('Sensitive history gate: no findings\n');
