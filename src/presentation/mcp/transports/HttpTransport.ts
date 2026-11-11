import { Express, Request, Response, NextFunction } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ApplicationContainer } from "../../../application/container.js";
import { TaskRepository } from "../../../infrastructure/persistence/TaskRepository.js";
import { randomUUID } from "crypto";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

export class HttpTransport {
  private app: Express;
  private port: number;
  private serverFactory: (() => McpServer) | null = null;
  private transports: Map<string, { transport: SSEServerTransport | StreamableHTTPServerTransport; server: McpServer }> = new Map();

  constructor(port?: number) {
    this.app = createMcpExpressApp({
      host: "0.0.0.0",
      allowedHosts: [
         "localhost",
         "127.0.0.1",
         "isabel-ll-uqicv-reqtiobkqw.cn-hangzhou.fcapp.run",
      ],
    });
    this.port = port || parseInt(process.env.PORT || "3000", 10);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, MCP-Session-Id, Last-Event-ID, Accept");
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
      next();
    });
  }

  private setupRoutes() {
    this.app.get("/health", (req: Request, res: Response) => {
      res.json({
        status: "ok",
        server: "simple-mcp-server",
        transport: "http/sse",
      });
    });

    this.app.post("/mcp", async (req: Request, res: Response) => {
      if (!this.serverFactory) {
        return res.status(500).json({ error: "MCP server factory not initialized" });
      }

      try {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        let transport: StreamableHTTPServerTransport | SSEServerTransport;

        if (sessionId && this.transports.has(sessionId)) {
          const existing = this.transports.get(sessionId)!;
          transport = existing.transport;
        } else if (!sessionId && req.body && isInitializeRequest(req.body)) {
          const server = this.serverFactory();
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (newSessionId: string) => {
              console.error(`[StreamableHTTP] Session initialized: ${newSessionId}`);
              const existing = Array.from(this.transports.values()).find(
                (t) => t.transport === transport
              );
              if (existing) {
                this.transports.set(newSessionId, existing);
              } else {
                this.transports.set(newSessionId, { transport, server });
              }
            },
          });
          
          await server.connect(transport);
          
          const tempId = `temp-${Date.now()}`;
          this.transports.set(tempId, { transport, server });
          
          await transport.handleRequest(req, res, req.body);
          
          this.transports.delete(tempId);
          return;
        } else {
          return res.status(400).json({ 
            jsonrpc: "2.0",
            error: { 
              code: -32000,
              message: "Bad Request: No valid session ID provided" 
            },
            id: null
          });
        }

        if (transport instanceof StreamableHTTPServerTransport) {
          await transport.handleRequest(req, res, req.body);
        } else {
          await (transport as SSEServerTransport).handlePostMessage(req, res);
        }
      } catch (error) {
        console.error("Error processing Streamable HTTP request:", error);
        if (!res.headersSent) {
          res.status(500).json({ 
            jsonrpc: "2.0",
            error: { 
              code: -32603,
              message: "Internal server error" 
            },
            id: null
          });
        }
      }
    });

    this.app.get("/mcp", async (req: Request, res: Response) => {
      if (!this.serverFactory) {
        return res.status(500).json({ error: "MCP server factory not initialized" });
      }

      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      
      if (sessionId && this.transports.has(sessionId)) {
        const existing = this.transports.get(sessionId)!;
        if (existing.transport instanceof StreamableHTTPServerTransport) {
          await existing.transport.handleRequest(req, res, undefined);
          return;
        }
      }

      try {
        const connectionId = `${Date.now()}-${Math.random()}`;
        const server = this.serverFactory();
        const transport = new SSEServerTransport("/messages", res);
        
        await server.connect(transport);
        this.transports.set(connectionId, { transport, server });

        req.on("close", () => {
          console.error(`SSE client disconnected (${connectionId})`);
          this.transports.delete(connectionId);
        });
      } catch (error) {
        console.error("Error in SSE connection:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to establish SSE connection" });
        }
      }
    });

    this.app.post("/messages", async (req: Request, res: Response) => {
      const activeConnection = Array.from(this.transports.values()).find(
        (conn) => conn.transport instanceof SSEServerTransport
      );
      
      if (!activeConnection) {
        return res.status(503).json({ error: "No active SSE connection" });
      }

      try {
        await (activeConnection.transport as SSEServerTransport).handlePostMessage(req, res);
      } catch (error) {
        console.error("Error processing SSE message:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to process message" });
        }
      }
    });

    this.app.get("/", (req: Request, res: Response) => {
      res.json({
        name: "simple-mcp-server",
        version: "1.0.0",
        transport: "streamable-http+sse-legacy",
        endpoints: {
          health: "/health",
          streamableHttp: "POST /mcp",
          sseLegacy: "GET /mcp",
          messagesLegacy: "POST /messages",
        },
      });
    });
  }

  async connect(server: McpServer): Promise<void> {
    this.serverFactory = () => {
      const taskRepository = new TaskRepository();
      const container = new ApplicationContainer(taskRepository);
      return container.getMCPServer().getServer();
    };
    
    return new Promise((resolve, reject) => {
      const httpServer = this.app.listen(this.port, () => {
        console.error(
          `Simple MCP Server running on HTTP (Streamable HTTP + SSE legacy) at http://localhost:${this.port}`
        );
        console.error(`Streamable HTTP endpoint: POST http://localhost:${this.port}/mcp`);
        console.error(`SSE endpoint (legacy): GET http://localhost:${this.port}/mcp`);
        console.error(`Messages endpoint (legacy): POST http://localhost:${this.port}/messages`);
        console.error(`Health check: http://localhost:${this.port}/health`);
        resolve();
      });

      httpServer.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Error: Port ${this.port} is already in use.`);
          console.error(`💡 Solution: Stop the process using the port or use a different port:`);
          console.error(`   PORT=3001 npm run start:http`);
          reject(error);
        } else {
          reject(error);
        }
      });
    });
  }
}
