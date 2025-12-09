
import app from './app.js';

// Cloudflare Workers Entry Point
export default {
  fetch: app.fetch,
};
