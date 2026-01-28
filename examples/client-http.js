#!/usr/bin/env node

/**
 * MCP client example using Streamable HTTP transport
 * 
 * This example shows how to connect to an MCP server running
 * in HTTP/Streamable HTTP mode (communication via HTTP with Server-Sent Events).
 * 
 * Usage:
 *   1. Start the server in HTTP mode: npm run start:http
 *   2. In another terminal, run this script: node examples/client-http.js
 * 
 * Environment variables:
 *   - MCP_SERVER_URL: MCP server URL (default: http://localhost:3000/mcp)
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3000/mcp";

async function testHttpClient() {
  console.log("🧪 MCP Client Example - Streamable HTTP transport\n");
  console.log(`📍 Connecting to: ${MCP_SERVER_URL}\n`);

  const client = new Client(
    {
      name: "http-example-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  let transport;
  try {
    console.log("1️⃣ Creating Streamable HTTP transport...");
    transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
    
    console.log("2️⃣ Connecting to server...");
    await client.connect(transport);
    console.log("✅ Connected successfully\n");

    console.log("3️⃣ Listing available tools...");
    const toolsResponse = await client.listTools();
    console.log(`✅ Found ${toolsResponse.tools.length} tools:`);
    toolsResponse.tools.forEach((tool) => {
      console.log(`   - ${tool.name}: ${tool.description || "No description"}`);
    });
    console.log();

    console.log("4️⃣ Testing create_task...");
    const createResult = await client.callTool({
      name: "create_task",
      arguments: {
        title: "Task from HTTP client",
        description: "This task was created using Streamable HTTP transport",
      },
    });
    const createData = JSON.parse(createResult.content[0].text);
    console.log("✅ Task created:");
    console.log(`   ID: ${createData.task.id}`);
    console.log(`   Title: ${createData.task.title}`);
    console.log(`   Completed: ${createData.task.completed}`);
    const taskId = createData.task.id;
    console.log();

    console.log("5️⃣ Testing list_tasks...");
    const listResult = await client.callTool({
      name: "list_tasks",
      arguments: {},
    });
    const listData = JSON.parse(listResult.content[0].text);
    console.log(`✅ Listed ${listData.count} tasks`);
    console.log();

    console.log("6️⃣ Testing complete_task...");
    const completeResult = await client.callTool({
      name: "complete_task",
      arguments: {
        taskId: taskId,
      },
    });
    const completeData = JSON.parse(completeResult.content[0].text);
    console.log("✅ Task completed:");
    console.log(`   ID: ${completeData.task.id}`);
    console.log(`   Completed: ${completeData.task.completed}`);
    console.log(`   Completion date: ${completeData.task.completedAt}`);
    console.log();

    console.log("7️⃣ Testing delete_task...");
    const deleteResult = await client.callTool({
      name: "delete_task",
      arguments: {
        taskId: taskId,
      },
    });
    const deleteData = JSON.parse(deleteResult.content[0].text);
    console.log(`✅ ${deleteData.message}`);
    console.log();

    console.log("🎉 All tests passed successfully!");
  } catch (error) {
    console.error("❌ Error during tests:", error);
    if (error.message) {
      console.error("   Message:", error.message);
    }
    if (error.stack) {
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  } finally {
    try {
      await client.close();
      console.log("🔌 Connection closed");
    } catch (closeError) {
      console.error("⚠️  Error closing connection:", closeError.message);
    }
  }
}

testHttpClient().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
