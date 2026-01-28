import { ITaskRepository } from "../domain/repositories/ITaskRepository.js";
import { CreateTaskUseCase } from "./use-cases/CreateTaskUseCase.js";
import { ListTasksUseCase } from "./use-cases/ListTasksUseCase.js";
import { CompleteTaskUseCase } from "./use-cases/CompleteTaskUseCase.js";
import { DeleteTaskUseCase } from "./use-cases/DeleteTaskUseCase.js";
import { CreateTaskTool } from "../presentation/mcp/tools/CreateTaskTool.js";
import { ListTasksTool } from "../presentation/mcp/tools/ListTasksTool.js";
import { CompleteTaskTool } from "../presentation/mcp/tools/CompleteTaskTool.js";
import { DeleteTaskTool } from "../presentation/mcp/tools/DeleteTaskTool.js";
import { MCPServer } from "../presentation/mcp/MCPServer.js";

export class ApplicationContainer {
  private taskRepository: ITaskRepository;
  private createTaskUseCase: CreateTaskUseCase;
  private listTasksUseCase: ListTasksUseCase;
  private completeTaskUseCase: CompleteTaskUseCase;
  private deleteTaskUseCase: DeleteTaskUseCase;
  private createTaskTool: CreateTaskTool;
  private listTasksTool: ListTasksTool;
  private completeTaskTool: CompleteTaskTool;
  private deleteTaskTool: DeleteTaskTool;
  private mcpServer: MCPServer;

  constructor(taskRepository: ITaskRepository) {
    this.taskRepository = taskRepository;
    
    this.createTaskUseCase = new CreateTaskUseCase(this.taskRepository);
    this.listTasksUseCase = new ListTasksUseCase(this.taskRepository);
    this.completeTaskUseCase = new CompleteTaskUseCase(this.taskRepository);
    this.deleteTaskUseCase = new DeleteTaskUseCase(this.taskRepository);

    this.createTaskTool = new CreateTaskTool(this.createTaskUseCase);
    this.listTasksTool = new ListTasksTool(this.listTasksUseCase);
    this.completeTaskTool = new CompleteTaskTool(this.completeTaskUseCase);
    this.deleteTaskTool = new DeleteTaskTool(this.deleteTaskUseCase);

    this.mcpServer = new MCPServer(
      this.createTaskTool,
      this.listTasksTool,
      this.completeTaskTool,
      this.deleteTaskTool
    );
  }

  getMCPServer(): MCPServer {
    return this.mcpServer;
  }
}
