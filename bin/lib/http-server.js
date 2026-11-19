import http from "node:http";

/**
 * Modern Streamable HTTP and SSE transport for hosted serverless deployments
 * @param {object} options
 * @param {number} options.port
 * @param {object} options.pkg
 * @param {string} options.milestone
 * @param {Array} options.tools
 * @param {Function} options.handleToolCall
 * @param {Function} options.getCatalog
 * @returns {Promise<import("node:http").Server>}
 */
export async function startStreamableHttpServer({
  port = 8080,
  pkg = {},
  milestone = "550+",
  tools = [],
  handleToolCall,
  getCatalog,
}) {
  const catalog = await getCatalog().catch(() => null);

  const server = http.createServer(async (req, res) => {
    // Enable CORS for web-based MCP clients
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-mcp-version");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const host = req.headers.host || `localhost:${port}`;
    const url = new URL(req.url, `http://${host}`);

    if (url.pathname === "/health" || url.pathname === "/ping") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          name: "devshelf-mcp",
          version: pkg.version || "1.1.2",
          protocolVersion: "2024-11-05",
          transports: ["stdio", "streamable-http", "sse"],
          curatedTools: catalog?.totalCount || 550,
          milestone,
        }),
      );
      return;
    }

    if (req.method === "GET" && (url.pathname === "/sse" || url.pathname === "/events")) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(`event: endpoint\ndata: ${url.origin}/mcp\n\n`);
      const keepAlive = setInterval(() => {
        res.write(": keep-alive\n\n");
      }, 15000);
      req.on("close", () => clearInterval(keepAlive));
      return;
    }

    // Streamable HTTP JSON-RPC endpoint (POST /mcp or POST /)
    if (
      req.method === "POST" &&
      (url.pathname === "/mcp" || url.pathname === "/" || url.pathname === "/message")
    ) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", async () => {
        try {
          const rpcReq = JSON.parse(body);
          const { id, method, params } = rpcReq;

          if (method === "initialize") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                jsonrpc: "2.0",
                id,
                result: {
                  protocolVersion: "2024-11-05",
                  serverInfo: { name: "devshelf-mcp", version: pkg.version || "1.1.2" },
                  capabilities: { tools: {} },
                },
              }),
            );
            return;
          }

          if (method === "notifications/initialized") {
            res.writeHead(204);
            res.end();
            return;
          }

          if (method === "ping") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ jsonrpc: "2.0", id, result: {} }));
            return;
          }

          if (method === "tools/list") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ jsonrpc: "2.0", id, result: { tools } }));
            return;
          }

          if (method === "tools/call") {
            const toolName = params?.name;
            const toolArgs = params?.arguments || {};
            const output = await handleToolCall(toolName, toolArgs);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                jsonrpc: "2.0",
                id,
                result: {
                  content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
                },
              }),
            );
            return;
          }

          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              id,
              error: { code: -32601, message: `Method not found: ${method}` },
            }),
          );
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              id: null,
              error: { code: -32700, message: `Internal error: ${err.message}` },
            }),
          );
        }
      });
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("DevShelf MCP Server - Supported Endpoints: /mcp (POST), /sse (GET), /health (GET)\n");
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      process.stderr.write(
        `🚀 [DevShelf MCP Server] Running on Streamable HTTP transport at http://localhost:${port}/mcp (${milestone} tools ready).\n`,
      );
      resolve(server);
    });
  });
}
