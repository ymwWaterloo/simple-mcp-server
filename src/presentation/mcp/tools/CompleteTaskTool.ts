import { CallToolResult, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { CompleteTaskUseCase } from "../../../application/use-cases/CompleteTaskUseCase.js";

const CompleteTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
});

export class CompleteTaskTool {
  constructor(private readonly completeTaskUseCase: CompleteTaskUseCase) {}

  getSchema() {
    return {
      description: "Marks a task as completed",
      inputSchema: CompleteTaskSchema as any,
    };
  }

  async handle(args: z.infer<typeof CompleteTaskSchema>): Promise<CallToolResult> {
    try {
      const validated = CompleteTaskSchema.parse(args);
      const task = await this.completeTaskUseCase.execute(validated.taskId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: "Task completed successfully",
                task: task.toJSON(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Internal error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
