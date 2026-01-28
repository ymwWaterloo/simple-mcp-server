import { Task } from "../../domain/entities/Task.js";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository.js";

export class ListTasksUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(): Promise<Task[]> {
    return await this.taskRepository.findAll();
  }
}
