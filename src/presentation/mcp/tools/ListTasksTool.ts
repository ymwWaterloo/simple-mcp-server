import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ListTasksUseCase } from "../../../application/use-cases/ListTasksUseCase.js";

export class ListTasksTool {
  constructor(private readonly listTasksUseCase: ListTasksUseCase) {}

  getSchema() {
    return {
      description: "Lists all tasks (completed and pending)",
      inputSchema: {},
    };
  }

  async handle(): Promise<CallToolResult> {
    const tasks = await this.listTasksUseCase.execute();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              count: tasks.length,
              tasks: tasks.map((task) => task.toJSON()),
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
