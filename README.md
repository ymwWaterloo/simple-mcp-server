# Simple MCP Server

A simple MCP (Model Context Protocol) server designed as a **template and reference guide** for future, more complex and scalable MCP projects.

## 🚀 Use this template

**On GitHub:** [Use this template](https://github.com/jgallo1994/simple-mcp-server/generate) → **Create a new repository**.  
*(Template repository is enabled in [Settings](https://github.com/jgallo1994/simple-mcp-server/settings).)*

**After creating your repo:**

1. Clone it, then run `npm install` and `npm run build`.
2. Copy `.env.example` to `.env` and set `TASKS_CSV_PATH`, `TRANSPORT`, etc. as needed.
3. In `package.json`, set `name` and the `repository` / `homepage` / `bugs` URLs for your project.
4. Replace the task tools and domain with your own; keep the layout (transports, container, use cases).

## 📋 Table of Contents

- [Use this template](#-use-this-template)
- [Description](#-description)
- [Requirements](#-requirements)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Development](#-development)
- [Supported Transports](#-supported-transports)
- [Client Examples](#-client-examples)
- [Project Structure](#-project-structure)
- [Features](#-features-implemented)
- [Configuration](#️-configuration)
- [Tool Usage](#-tool-usage)
- [Key Concepts](#-key-concepts-learned)
- [Troubleshooting](#-troubleshooting)
- [Creating an Agent](#-creating-an-agent-that-consumes-this-mcp)

## 📋 Description

This server implements a basic task manager with the following features:

- **create_task**: Create a new task with title and optional description
- **list_tasks**: List all tasks (completed and pending)
- **complete_task**: Mark a task as completed
- **delete_task**: Delete a task by its ID

## ✅ Requirements

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher (or equivalent yarn/pnpm)
- **TypeScript**: Installed automatically as a development dependency

To verify your versions:

```bash
node --version  # Must be >= 18.0.0
npm --version   # Must be >= 9.0.0
```

## ⚡ Quick Start

```bash
# 1. Clone or download the project
git clone https://github.com/jgallo1994/simple-mcp-server.git
cd simple-mcp-server

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Run (stdio mode - default)
npm start

# Or run in HTTP/Streamable HTTP mode
npm run start:http
```

The server will be ready to use. In stdio mode, it communicates via stdin/stdout. In HTTP mode, it will be available at `http://localhost:3000`.

### Testing with Examples

Once the server is running, you can test it with the included examples:

```bash
# Test with stdio client (requires server in stdio mode)
npm run example:stdio

# Test with HTTP client (requires server in HTTP mode)
npm run example:http
```

**See more examples:** [examples/README.md](examples/README.md)

## 🚀 Installation

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run the server
npm start
```

## 🔧 Development

For development with auto-reload:

```bash
# Stdio mode (default)
npm run dev
# or explicitly
npm run dev:stdio

# HTTP/SSE mode
npm run dev:http
```

### Stopping the Server

- **stdio**: `Ctrl+C` in the terminal.
- **HTTP**: `Ctrl+C`, or free the port manually:
  ```bash
  # macOS/Linux – stop process on port 3000
  lsof -ti:3000 | xargs kill -9
  ```

## 🌐 Supported Transports

This MCP server supports two types of transport:

### 1. **stdio** (Default)
Communication via stdin/stdout. Ideal for:
- Local development
- Integration with Cursor or other local MCP clients
- Testing and debugging
- Process-to-process communication

**Usage:**
```bash
npm start
# or explicitly
npm run start:stdio
TRANSPORT=stdio npm start
```

**Example connection from a client:**
```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { capabilities: {} }
);

// Connect using stdio
const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: { ...process.env, TRANSPORT: "stdio" }
});

await client.connect(transport);

// Use the client
const tools = await client.listTools();
const result = await client.callTool({
  name: "create_task",
  arguments: { title: "My task", description: "Description" }
});
```

**See full example:** `examples/client-stdio.js`

### 2. **HTTP/Streamable HTTP** (Recommended for production)
Communication via HTTP with Streamable HTTP (modern protocol). Ideal for:
- Cloud deployment (AWS, GCP, Azure)
- Multiple remote clients
- Integration with conversational agents (WhatsApp, etc.)
- Horizontal scalability
- ~200x better performance than SSE legacy

**Usage:**
```bash
npm run start:http
# or with environment variables
TRANSPORT=http PORT=3000 npm start
```

**Available endpoints in HTTP mode:**
- `GET /` - Server information
- `GET /health` - Health check
- `POST /mcp` - Main endpoint for Streamable HTTP (modern protocol)
- `GET /mcp` - SSE endpoint for legacy connection (backward compatibility)
- `POST /messages` - Endpoint for SSE legacy messages (backward compatibility)

**Example connection from a client (Streamable HTTP - Recommended):**
```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { capabilities: {} }
);

// Connect using Streamable HTTP (modern protocol)
const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp")
);

await client.connect(transport);

// Use the client
const tools = await client.listTools();
const result = await client.callTool({
  name: "create_task",
  arguments: { title: "My task", description: "Description" }
});
```

**See full example:** `examples/client-http.js`

## 📚 Client Examples

This project includes complete examples of how to create clients for both protocols:

### Example: stdio Client

**File:** `examples/client-stdio.js`

This example shows how to connect to an MCP server using stdio transport:

```bash
# Terminal 1: Start server
npm run start:stdio

# Terminal 2: Run client
node examples/client-stdio.js
```

**Features:**
- Starts the server as a child process
- Connects via stdin/stdout
- Executes all CRUD operations
- Ideal for local development and testing

### Example: HTTP/Streamable HTTP Client

**File:** `examples/client-http.js`

This example shows how to connect to an MCP server using Streamable HTTP transport:

```bash
# Terminal 1: Start server
npm run start:http

# Terminal 2: Run client
node examples/client-http.js

# Or with custom URL
MCP_SERVER_URL=http://localhost:3000/mcp node examples/client-http.js
```

**Features:**
- Connects to remote server via HTTP
- Uses Streamable HTTP protocol (modern)
- Executes all CRUD operations
- Ideal for production and cloud deployment

### Protocol Comparison

| Feature | stdio | Streamable HTTP |
|---------|-------|-----------------|
| **Usage** | Local, development | Production, remote |
| **Performance** | High (local process) | ~200x better than SSE legacy |
| **Scalability** | One client per process | Multiple simultaneous clients |
| **Deployment** | No HTTP server required | Requires HTTP server |
| **Complexity** | Low | Medium |
| **Recommended for** | Cursor, development | AWS, conversational agents |

### Configuration for HTTP Mode in Production

If you're using HTTP/Streamable HTTP mode and want to connect from a remote client:

**Client configuration example:**
```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { capabilities: {} }
);

// Connect to remote server
const transport = new StreamableHTTPClientTransport(
  new URL("https://api.yourdomain.com/mcp")
);

await client.connect(transport);
const tools = await client.listTools();
```

**AWS Deployment (example with ECS):**
```json
{
  "containerDefinitions": [{
    "name": "mcp-server",
    "image": "your-image:latest",
    "environment": [
      { "name": "TRANSPORT", "value": "http" },
      { "name": "PORT", "value": "3000" },
      { "name": "TASKS_CSV_PATH", "value": "/data/tasks.csv" }
    ],
    "portMappings": [{
      "containerPort": 3000,
      "protocol": "tcp"
    }]
  }]
}
```

**Important notes:**

- The path can be absolute or relative (it will be automatically resolved to absolute)
- If the directory doesn't exist, it will be automatically created when saving the first task
- The `TASKS_CSV_PATH` environment variable takes priority over the default path
- In development mode (`NODE_ENV !== "production"`), a log will be shown indicating which path is being used
- You can use the `.env.example` file as a template for your environment variables

## 📦 Project Structure

```
simple-mcp-server/
├── src/
│   ├── index.ts                    # Entry point (selects transport based on configuration)
│   ├── domain/                     # Domain layer
│   │   ├── entities/              # Domain entities
│   │   └── repositories/          # Repository interfaces
│   ├── application/               # Application layer
│   │   ├── use-cases/            # Use cases
│   │   └── container.ts         # Dependency container
│   ├── infrastructure/           # Infrastructure layer
│   │   └── persistence/         # Persistence implementations
│   └── presentation/             # Presentation layer
│       └── mcp/
│           ├── MCPServer.ts      # MCP server (without transport)
│           ├── transports/       # Transport implementations
│           │   ├── StdioTransport.ts
│           │   └── HttpTransport.ts
│           └── tools/           # MCP tools
├── examples/                      # Client examples
│   ├── client-stdio.js           # stdio client example
│   └── client-http.js             # HTTP client example
├── dist/                         # Compiled code (generated)
├── package.json
├── tsconfig.json
├── mcp-config.example.json       # Example configuration for Cursor
├── .env.example                  # Example environment variables
├── LICENSE                       # MIT
└── README.md
```

**When using as template:** Replace `domain/`, `application/use-cases/`, `presentation/mcp/tools/`, and persistence as needed. Keep `transports/`, `container.ts`, and `index.ts`; wire your new use cases and tools in the container and MCPServer.

## 🎯 Features Implemented

### 1. **Tools**

- Tool definition with input schemas
- Parameter validation using Zod
- Structured error handling

### 2. **Clean Architecture**

- Separation of concerns (Store, Server, Handlers)
- TypeScript types for type safety
- Modular and extensible code

### 3. **Error Handling**

- Input validation with Zod
- Standard MCP errors (InvalidParams, MethodNotFound, etc.)
- Descriptive error messages

## ⚙️ Configuration

### Environment Variables

#### Transport Type

Controls which transport type to use:
- `stdio` (default) - stdin/stdout communication
- `http` or `sse` - HTTP/SSE communication

```bash
export TRANSPORT=http
export PORT=3000  # Only for HTTP mode
```

#### Environment Variable: CSV File Path

You can configure where the `tasks.csv` file is saved using the `TASKS_CSV_PATH` environment variable:

```bash
# Example: Save to a custom directory
export TASKS_CSV_PATH="/custom/path/my-tasks.csv"

# Example: Save to home directory
export TASKS_CSV_PATH="$HOME/tasks.csv"
```

**Configuration priority:**

1. Explicit parameter to constructor (only for programmatic use)
2. `TASKS_CSV_PATH` environment variable
3. Default path: `{project-root}/tasks.csv`

### Cursor Configuration

To use this MCP server in Cursor, add the following configuration to your MCP configuration file (usually in `~/.cursor/mcp.json` or in Cursor's configuration).

> 💡 **Tip**: The `mcp-config.example.json` file includes **two complete examples** (stdio and HTTP). Just copy the one you need and adjust the paths according to your system.

**Example 1: stdio Configuration (Recommended for Cursor)**

```json
{
  "mcpServers": {
    "simple-mcp-server-stdio": {
      "command": "npm",
      "args": ["start"],
      "cwd": "/full/path/to/simple-mcp-server",
      "env": {
        "TASKS_CSV_PATH": "/custom/path/tasks.csv",
        "TRANSPORT": "stdio"
      }
    }
  }
}
```

**Example 2: HTTP/Streamable HTTP Configuration**

```json
{
  "mcpServers": {
    "simple-mcp-server-http": {
      "command": "npm",
      "args": ["start:http"],
      "cwd": "/full/path/to/simple-mcp-server",
      "env": {
        "TASKS_CSV_PATH": "/custom/path/tasks.csv",
        "TRANSPORT": "http",
        "PORT": "3000"
      }
    }
  }
}
```

**Important notes:**

- **stdio**: Use `"args": ["start"]` and `"TRANSPORT": "stdio"`. Ideal for use with Cursor.
- **HTTP**: Use `"args": ["start:http"]` and `"TRANSPORT": "http"`. Requires the server to be running before connecting.
- Adjust `"cwd"` with the absolute path to your project.
- Adjust `"TASKS_CSV_PATH"` with the path where you want to save the CSV file (optional).

> 💡 **Note**: The `mcp-config.example.json` file includes both examples. You can copy and paste directly, just adjusting the paths.

## 📝 Tool Usage

All tools follow the standard MCP protocol. Here are examples of how to use them:

### Create a Task

**Tool**: `create_task`

**Parameters**:
- `title` (string, required): Task title
- `description` (string, optional): Task description

**Example**:
```json
{
  "name": "create_task",
  "arguments": {
    "title": "Complete documentation",
    "description": "Write the project documentation"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "id": "task-1",
    "title": "Complete documentation",
    "description": "Write the project documentation",
    "completed": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": null
  }
}
```

### List Tasks

**Tool**: `list_tasks`

**Parameters**: None

**Example**:
```json
{
  "name": "list_tasks",
  "arguments": {}
}
```

**Response**:
```json
{
  "success": true,
  "count": 2,
  "tasks": [
    {
      "id": "task-1",
      "title": "Complete documentation",
      "description": "Write the project documentation",
      "completed": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "completedAt": null
    },
    {
      "id": "task-2",
      "title": "Review code",
      "description": null,
      "completed": true,
      "createdAt": "2024-01-14T09:00:00.000Z",
      "completedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### Complete a Task

**Tool**: `complete_task`

**Parameters**:
- `taskId` (string, required): ID of the task to complete

**Example**:
```json
{
  "name": "complete_task",
  "arguments": {
    "taskId": "task-1"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Task completed successfully",
  "task": {
    "id": "task-1",
    "title": "Complete documentation",
    "completed": true,
    "completedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Delete a Task

**Tool**: `delete_task`

**Parameters**:
- `taskId` (string, required): ID of the task to delete

**Example**:
```json
{
  "name": "delete_task",
  "arguments": {
    "taskId": "task-1"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### Error Handling

If an error occurs, the response will follow the standard MCP format:

```json
{
  "error": {
    "code": -32602,
    "message": "Validation error: Title is required"
  }
}
```

Common error codes:
- `-32602` (InvalidParams): Invalid or missing parameters
- `-32601` (MethodNotFound): Tool not found
- `-32603` (InternalError): Internal server error

## 🎓 Key Concepts Learned

1. **Server Setup**: Creating an MCP server with the official SDK
2. **Transport Layer**: Support for multiple transports (stdio and Streamable HTTP)
3. **Tool Definition**: Defining tools with JSON schemas
4. **Request Handlers**: Handling ListToolsRequest and CallToolRequest
5. **Error Handling**: Using McpError and ErrorCode for standard errors
6. **Validation**: Input validation with Zod
7. **Clean Architecture**: Separation of responsibilities by layers
8. **Flexible Configuration**: Support for different modes according to environment
9. **Streamable HTTP**: Modern protocol for remote communication (~200x better performance)
10. **Client Examples**: Complete examples for both protocols

## 🔄 Next Steps to Scale

This template can be extended with the following features:

- ✅ **Advanced persistence**: Migrate from CSV to SQL (PostgreSQL, MySQL) or NoSQL (MongoDB)
- ✅ **Resources**: Add read-only resources (documents, configurations)
- ✅ **Prompts**: Predefined templates for the agent
- ✅ **Authentication and security**: Tokens, API keys, rate limiting
- ✅ **Logging and monitoring**: Winston, Pino, or CloudWatch
- ✅ **Testing**: Vitest, Jest for unit and integration tests
- ✅ **API documentation**: OpenAPI/Swagger
- ✅ **Deployment**: Docker, CI/CD with GitHub Actions

---

## 🐛 Troubleshooting

### Server won't start

**Problem**: Error when running `npm start`

**Solutions**:
1. Verify you've compiled the project: `npm run build`
2. Verify Node.js version: `node --version` (must be >= 18)
3. Reinstall dependencies: `rm -rf node_modules && npm install`

### "Cannot find module" error in HTTP mode

**Problem**: Error importing express or related modules

**Solution**: 
```bash
npm install
npm run build
```

### HTTP mode doesn't respond

**Problem**: HTTP server starts but doesn't respond to requests

**Solutions**:
1. Verify the port is not in use: `lsof -i :3000`
2. Verify you're using the correct endpoint: `http://localhost:3000/mcp`
3. Check server logs for errors

### Cursor doesn't detect the MCP

**Problem**: MCP doesn't appear in Cursor

**Solutions**:
1. Verify the path in `mcp-config.example.json` - must be absolute
2. Restart Cursor after changing the configuration
3. Verify the file is compiled: `ls dist/index.js`
4. Check Cursor logs for connection errors

### Permission error writing CSV

**Problem**: Cannot write the `tasks.csv` file

**Solutions**:
1. Verify directory permissions: `chmod 755 /path/to/directory`
2. Use a custom path with `TASKS_CSV_PATH`
3. Verify the directory exists or has write permissions

### HTTP transport doesn't work in production

**Problem**: Works locally but not on AWS/cloud

**Solutions**:
1. Verify the `TRANSPORT=http` variable is configured
2. Verify the port is exposed in the container/service
3. Verify firewall/security group rules
4. Check CloudWatch or service logs

---

## 🤖 Creating an Agent that Consumes this MCP

Once you have the MCP server running, you can create an agent that consumes it. Here are the steps:

### 1. Configure the MCP in Cursor

Make sure the MCP is configured in Cursor (see "Cursor Configuration" section above).

### 2. The agent can use the tools directly

The agent (like me) can call the MCP tools using `call_mcp_tool`:

```typescript
// Example of how an agent would consume the MCP
const result = await call_mcp_tool({
  server: "simple-mcp-server",
  toolName: "create_task",
  arguments: {
    title: "New task",
    description: "Task description",
  },
});
```

### 3. Integration with other systems

You can create a wrapper or service that:

- Consumes the MCP server
- Processes responses
- Integrates with other systems (APIs, databases, etc.)
- Provides a more user-friendly interface

### Wrapper Example

```typescript
// agent-wrapper.ts
import { MCPClient } from "@modelcontextprotocol/sdk/client/index.js";

class TaskAgent {
  private mcpClient: MCPClient;

  async initialize() {
    // Connect to MCP server
    this.mcpClient = new MCPClient({
      name: "task-agent",
      version: "1.0.0",
    });
    // ... transport configuration
  }

  async createTask(title: string, description?: string) {
    const result = await this.mcpClient.callTool({
      name: "create_task",
      arguments: { title, description },
    });
    return JSON.parse(result.content[0].text);
  }

  // ... more wrapper methods
}
```

---

**Author:** [John Gallo](https://github.com/jgallo1994) · [simple-mcp-server](https://github.com/jgallo1994/simple-mcp-server)
