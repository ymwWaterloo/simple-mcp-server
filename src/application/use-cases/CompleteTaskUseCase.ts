import { Task } from "../../domain/entities/Task.js";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository.js";

export class CompleteTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<Task> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error(`Task with ID "${taskId}" not found`);
    }
    const completedTask = task.complete();
    return await this.taskRepository.update(completedTask);
  }
}
