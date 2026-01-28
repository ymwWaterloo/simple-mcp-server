# MCP Client Examples

This directory contains complete examples of how to create clients to connect to the MCP server using different transport protocols.

## 📋 Available Examples

### 1. `client-stdio.js` - Client with stdio transport

Example of a client that connects to the MCP server using stdin/stdout communication.

**When to use:**
- Local development
- Testing and debugging
- Integration with local tools (Cursor, etc.)
- Process-to-process communication

**How to run:**

```bash
# Terminal 1: Start the server in stdio mode
npm run start:stdio

# Terminal 2: Run the client
npm run example:stdio
# or directly
node examples/client-stdio.js
```

**Features:**
- Starts the MCP server as a child process
- Communicates via stdin/stdout
- Executes all CRUD operations (create, list, complete, delete)
- Ideal for development and testing

### 2. `client-http.js` - Client with Streamable HTTP transport

Example of a client that connects to the MCP server using HTTP/Streamable HTTP.

**When to use:**
- Production and cloud deployment
- Multiple remote clients
- Integration with conversational agents
- Horizontal scalability

**How to run:**

```bash
# Terminal 1: Start the server in HTTP mode
npm run start:http

# Terminal 2: Run the client
npm run example:http
# or directly
node examples/client-http.js

# With custom URL
MCP_SERVER_URL=http://localhost:3000/mcp node examples/client-http.js
```

**Features:**
- Connects to remote server via HTTP
- Uses Streamable HTTP protocol (modern, ~200x better performance than SSE legacy)
- Executes all CRUD operations
- Ideal for production

## 🔄 Protocol Comparison

| Feature | stdio | Streamable HTTP |
|---------|-------|-----------------|
| **Usage** | Local, development | Production, remote |
| **Performance** | High (local process) | ~200x better than SSE legacy |
| **Scalability** | One client per process | Multiple simultaneous clients |
| **Deployment** | No HTTP server required | Requires HTTP server |
| **Complexity** | Low | Medium |
| **Recommended for** | Cursor, development | AWS, conversational agents |

## 📝 Example Structure

Both examples follow the same structure:

1. **Import dependencies**: MCP client and specific transport
2. **Create client**: Instantiate `Client` with name and version
3. **Create transport**: Instantiate the transport (stdio or HTTP)
4. **Connect**: Connect the client to the server
5. **List tools**: Get list of available tools
6. **Execute operations**: Test all CRUD operations
7. **Close connection**: Close the connection when finished

## 🚀 Using in Your Own Project

You can use these examples as a base to create your own MCP client:

### stdio Client

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { capabilities: {} }
);

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: { ...process.env, TRANSPORT: "stdio" }
});

await client.connect(transport);
// Use the client...
```

### HTTP Client

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { capabilities: {} }
);

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp")
);

await client.connect(transport);
// Use the client...
```

## 🐛 Troubleshooting

### Error: "Cannot find module"

Make sure you've installed the dependencies:
```bash
npm install
```

### Error: "ECONNREFUSED" (HTTP client)

Verify that the server is running:
```bash
# Verify the server is running
curl http://localhost:3000/health
```

### Error: "Transport already connected"

Make sure to close the connection before creating a new one:
```javascript
await client.close();
```

## 📚 More Information

For more details on how to use these examples or create your own client, see the [main README](../README.md).
