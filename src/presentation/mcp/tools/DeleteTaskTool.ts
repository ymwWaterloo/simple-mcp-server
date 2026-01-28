import { CallToolResult, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { DeleteTaskUseCase } from "../../../application/use-cases/DeleteTaskUseCase.js";

const DeleteTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
});

export class DeleteTaskTool {
  constructor(private readonly deleteTaskUseCase: DeleteTaskUseCase) {}

  getSchema() {
    return {
      description: "Deletes a task by its ID",
      inputSchema: DeleteTaskSchema as any,
    };
  }

  async handle(args: z.infer<typeof DeleteTaskSchema>): Promise<CallToolResult> {
    try {
      const validated = DeleteTaskSchema.parse(args);
      await this.deleteTaskUseCase.execute(validated.taskId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: "Task deleted successfully",
                taskId: validated.taskId,
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
