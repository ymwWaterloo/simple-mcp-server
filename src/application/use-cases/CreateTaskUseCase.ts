import { Task } from "../../domain/entities/Task.js";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository.js";

export class CreateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(title: string, description?: string): Promise<Task> {
    if (!title || title.trim().length === 0) {
      throw new Error("Title is required");
    }
    return await this.taskRepository.create(title.trim(), description?.trim());
  }
}
