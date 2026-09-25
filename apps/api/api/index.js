// Vercel serverless entry: reuses the compiled Nest app (run `npm run build` first).
const { createApp } = require('../dist/app.module');

let server;

module.exports = async (req, res) => {
  if (!server) {
    const app = await createApp();
    await app.init();
    server = app.getHttpAdapter().getInstance();
  }
  return server(req, res);
};
