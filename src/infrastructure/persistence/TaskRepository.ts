import { Task } from "../../domain/entities/Task.js";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository.js";
import { CsvAdapter } from "./CsvAdapter.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

export class TaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();
  private nextId: number = 1;
  private csvPath: string;

  constructor(csvPath?: string) {
    let resolvedPath: string;
    
    if (csvPath) {
      resolvedPath = resolve(csvPath);
    } else if (process.env.TASKS_CSV_PATH) {
      resolvedPath = resolve(process.env.TASKS_CSV_PATH);
    } else {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const distDir = dirname(__dirname);
      const srcDir = dirname(distDir);
      const projectRoot = dirname(srcDir);
      resolvedPath = join(projectRoot, "tasks.csv");
    }

    if (existsSync(resolvedPath)) {
      try {
        const stats = statSync(resolvedPath);
        if (stats.isDirectory()) {
          this.csvPath = join(resolvedPath, "tasks.csv");
          if (process.env.NODE_ENV !== "production") {
            console.error(`[TaskRepository] Path is a directory, using: ${this.csvPath}`);
          }
        } else {
          this.csvPath = resolvedPath;
        }
      } catch (error) {
        this.csvPath = resolvedPath;
      }
    } else {
      const parentDir = dirname(resolvedPath);
      if (!existsSync(parentDir)) {
        try {
          mkdirSync(parentDir, { recursive: true });
          if (process.env.NODE_ENV !== "production") {
            console.error(`[TaskRepository] Directory created: ${parentDir}`);
          }
        } catch (error) {
          console.error(`[TaskRepository] Error creating directory: ${error}`);
        }
      }
      this.csvPath = resolvedPath;
    }

    if (process.env.NODE_ENV !== "production") {
      if (process.env.TASKS_CSV_PATH) {
        console.error(`[TaskRepository] Using path from TASKS_CSV_PATH: ${this.csvPath}`);
      } else {
        console.error(`[TaskRepository] Using default path: ${this.csvPath}`);
      }
    }

    this.loadFromCSV();
  }

  async create(title: string, description?: string): Promise<Task> {
    if (!existsSync(this.csvPath)) {
      this.tasks.clear();
      this.nextId = 1;
    }
    
    const id = this.generateNextId();
    const task = Task.create(title, description, id);
    this.tasks.set(id, task);
    await this.saveToCSV();
    return task;
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async update(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    await this.saveToCSV();
    return task;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.tasks.delete(id);
    if (deleted) {
      await this.saveToCSV();
    }
    return deleted;
  }

  private generateNextId(): string {
    return `task-${this.nextId++}`;
  }

  private parseCSVLine(line: string): Task | null {
    const fields = CsvAdapter.parseLine(line);
    if (fields.length < 5) return null;

    const [id, title, description, completed, createdAt, completedAt] = fields;
    const idNumber = parseInt(id.replace("task-", "")) || 0;
    if (idNumber >= this.nextId) {
      this.nextId = idNumber + 1;
    }

    return new Task(
      id,
      CsvAdapter.unescape(title),
      description ? CsvAdapter.unescape(description) : undefined,
      completed === "true",
      new Date(createdAt),
      completedAt ? new Date(completedAt) : undefined
    );
  }

  private taskToCSVLine(task: Task): string {
    return CsvAdapter.toLine([
      task.id,
      task.title,
      task.description || "",
      task.completed ? "true" : "false",
      task.createdAt.toISOString(),
      task.completedAt ? task.completedAt.toISOString() : "",
    ]);
  }

  private loadFromCSV(): void {
    try {
      const content = readFileSync(this.csvPath, "utf-8");
      const lines = content.trim().split("\n");

      if (lines.length <= 1 || (lines.length === 1 && lines[0]?.startsWith("id,"))) {
        this.tasks.clear();
        this.nextId = 1;
        return;
      }

      const startIndex = lines[0]?.startsWith("id,") ? 1 : 0;
      this.tasks.clear();
      let maxId = 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const task = this.parseCSVLine(line);
        if (task) {
          this.tasks.set(task.id, task);
          const idNumber = parseInt(task.id.replace("task-", "")) || 0;
          if (idNumber > maxId) {
            maxId = idNumber;
          }
        }
      }
      
      this.nextId = maxId + 1;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "ENOENT") {
        this.tasks.clear();
        this.nextId = 1;
        this.saveToCSV();
        return;
      }
      console.error(`Error loading CSV: ${error instanceof Error ? error.message : String(error)}`);
      this.tasks.clear();
      this.nextId = 1;
    }
  }

  private async saveToCSV(): Promise<void> {
    try {
      const lines = ["id,title,description,completed,createdAt,completedAt"];
      const tasks = Array.from(this.tasks.values());
      tasks.sort((a, b) => a.id.localeCompare(b.id));
      
      for (const task of tasks) {
        lines.push(this.taskToCSVLine(task));
      }

      writeFileSync(this.csvPath, lines.join("\n") + "\n", "utf-8");
    } catch (error) {
      console.error(`Error saving CSV: ${error}`);
      throw new Error(`Failed to save to CSV: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
