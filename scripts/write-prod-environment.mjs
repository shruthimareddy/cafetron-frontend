import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const apiUrl = (process.env.API_URL || '/api').replace(/\/$/, '');
const wsUrl = (process.env.WS_URL || apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '/ws')).replace(/\/$/, '');
const outputPath = resolve('src/environments/environment.prod.ts');

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  wsUrl: '${wsUrl}',
};
`,
);
