import { ITaskRepository } from "../../domain/repositories/ITaskRepository.js";

export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<void> {
    const deleted = await this.taskRepository.delete(taskId);
    if (!deleted) {
      throw new Error(`Task with ID "${taskId}" not found`);
    }
  }
}
