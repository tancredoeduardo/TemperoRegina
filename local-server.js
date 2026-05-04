const { createServer } = require("./server/app");
const { port, siteOrigin } = require("./server/config");

createServer().listen(port, () => {
  const displayUrl = siteOrigin || `http://127.0.0.1:${port}`;
  console.log(`Tempero Regina clone: ${displayUrl}`);
});
