import { CallToolResult, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { CreateTaskUseCase } from "../../../application/use-cases/CreateTaskUseCase.js";

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export class CreateTaskTool {
  constructor(private readonly createTaskUseCase: CreateTaskUseCase) {}

  getSchema() {
    return {
      description: "Creates a new task with title and optional description",
      inputSchema: CreateTaskSchema as any,
    };
  }

  async handle(args: z.infer<typeof CreateTaskSchema>): Promise<CallToolResult> {
    try {
      const validated = CreateTaskSchema.parse(args);
      const task = await this.createTaskUseCase.execute(
        validated.title,
        validated.description
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: "Task created successfully",
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
      throw error;
    }
  }
}
