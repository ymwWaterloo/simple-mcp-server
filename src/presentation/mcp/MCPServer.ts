import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CreateTaskTool } from "./tools/CreateTaskTool.js";
import { ListTasksTool } from "./tools/ListTasksTool.js";
import { CompleteTaskTool } from "./tools/CompleteTaskTool.js";
import { DeleteTaskTool } from "./tools/DeleteTaskTool.js";

export class MCPServer {
  private server: McpServer;
  private createTaskTool: CreateTaskTool;
  private listTasksTool: ListTasksTool;
  private completeTaskTool: CompleteTaskTool;
  private deleteTaskTool: DeleteTaskTool;

  constructor(
    createTaskTool: CreateTaskTool,
    listTasksTool: ListTasksTool,
    completeTaskTool: CompleteTaskTool,
    deleteTaskTool: DeleteTaskTool
  ) {
    this.createTaskTool = createTaskTool;
    this.listTasksTool = listTasksTool;
    this.completeTaskTool = completeTaskTool;
    this.deleteTaskTool = deleteTaskTool;

    this.server = new McpServer(
      {
        name: "simple-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.registerTool(
      "create_task",
      this.createTaskTool.getSchema(),
      (args: any) => this.createTaskTool.handle(args)
    );

    this.server.registerTool(
      "list_tasks",
      this.listTasksTool.getSchema(),
      () => this.listTasksTool.handle()
    );

    this.server.registerTool(
      "complete_task",
      this.completeTaskTool.getSchema(),
      (args: any) => this.completeTaskTool.handle(args)
    );

    this.server.registerTool(
      "delete_task",
      this.deleteTaskTool.getSchema(),
      (args: any) => this.deleteTaskTool.handle(args)
    );
  }

  getServer(): McpServer {
    return this.server;
  }
}
