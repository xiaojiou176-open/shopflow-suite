import { pathToFileURL } from 'node:url';
import { runShopflowReadOnlyMcpServer as startServer } from './server';

export async function runShopflowReadOnlyMcpServer() {
  await startServer();
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  runShopflowReadOnlyMcpServer().catch((error) => {
    console.error('Shopflow MCP server failed:', error);
    process.exit(1);
  });
}
