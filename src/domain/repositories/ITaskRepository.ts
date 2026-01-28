import { Task } from "../entities/Task.js";

export interface ITaskRepository {
  create(title: string, description?: string): Promise<Task>;
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<boolean>;
}
