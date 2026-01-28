import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export class StdioTransport {
  private transport: StdioServerTransport;

  constructor() {
    this.transport = new StdioServerTransport();
  }

  async connect(server: McpServer): Promise<void> {
    await server.connect(this.transport);
    console.error("Simple MCP Server running on stdio");
  }
}
