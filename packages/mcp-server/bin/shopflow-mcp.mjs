#!/usr/bin/env -S node --import tsx

import { runShopflowReadOnlyMcpServer } from '../src/bin.ts';

await runShopflowReadOnlyMcpServer();
