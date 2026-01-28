export class Task {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly completed: boolean,
    public readonly createdAt: Date,
    public readonly completedAt: Date | undefined
  ) {}

  static create(title: string, description?: string, id?: string): Task {
    const taskId = id || `task-${Date.now()}`;
    return new Task(
      taskId,
      title,
      description,
      false,
      new Date(),
      undefined
    );
  }

  complete(): Task {
    if (this.completed) {
      return this;
    }
    return new Task(
      this.id,
      this.title,
      this.description,
      true,
      this.createdAt,
      new Date()
    );
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      createdAt: this.createdAt.toISOString(),
      completedAt: this.completedAt?.toISOString(),
    };
  }
}
