import handler from './handler';

export interface Env {
  API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    // Set CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/api/health') {
      const response = new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      return response;
    }

    // API handler endpoint
    if (url.pathname.startsWith('/api/handler')) {
      try {
        const response = await handler.fetch(request, env, ctx);
        // Ensure the handler's response also gets CORS headers
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      } catch (e) {
        console.error('Handler error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // For other paths, return a 404. In a real Cloudflare Pages setup,
    // Pages would serve static assets before the worker is invoked.
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};