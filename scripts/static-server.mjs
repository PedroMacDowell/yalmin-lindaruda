import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

createServer(async (request, response) => {
  const requestedPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const filePath = resolve(join(root, normalize(requestedPath)));
  const safePath = filePath.startsWith(root) ? filePath : join(root, "index.html");
  const target = safePath.endsWith(join("scripts", "")) ? join(safePath, "index.html") : safePath;
  const finalPath = target === root ? join(root, "index.html") : target;

  try {
    await access(finalPath);
    response.writeHead(200, { "Content-Type": contentTypes[extname(finalPath)] || "application/octet-stream" });
    createReadStream(finalPath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Static server listening on http://127.0.0.1:${port}`);
});