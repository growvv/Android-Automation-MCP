#!/usr/bin/env node

import { runServer } from './mcp/server.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    console.error('Starting Android MCP Server...');
    await runServer();
  } catch (error) {
    console.error('Failed to start Android MCP Server:', error);
    process.exit(1);
  }
}

// Check if this is the main module in ES module context
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}