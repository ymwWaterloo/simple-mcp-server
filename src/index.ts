#!/usr/bin/env node

/**
 * Simple MCP Server
 * Task manager with CSV persistence
 * Supports transports: stdio (default) and HTTP/SSE
 */

import dotenv from "dotenv";
import { resolve } from "path";

const projectRoot = process.cwd();
const envPath = resolve(projectRoot, ".env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[dotenv] .env file not found at ${envPath}, using system variables`);
  }
} else {
  if (process.env.NODE_ENV !== "production") {
    const loadedVars = Object.keys(result.parsed || {}).length;
    console.error(`[dotenv] Loaded ${loadedVars} variables from: ${envPath}`);
  }
}

import { TaskRepository } from "./infrastructure/persistence/TaskRepository.js";
import { ApplicationContainer } from "./application/container.js";
import { StdioTransport } from "./presentation/mcp/transports/StdioTransport.js";
import { HttpTransport } from "./presentation/mcp/transports/HttpTransport.js";

const taskRepository = new TaskRepository();
const container = new ApplicationContainer(taskRepository);
const mcpServer = container.getMCPServer();
const server = mcpServer.getServer();

const transportType = process.env.TRANSPORT?.toLowerCase() || "stdio";

async function start() {
  try {
    if (transportType === "http" || transportType === "sse") {
      const port = parseInt(process.env.PORT || "3000", 10);
      const httpTransport = new HttpTransport(port);
      await httpTransport.connect(server);
    } else {
      const stdioTransport = new StdioTransport();
      await stdioTransport.connect(server);
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

start();
