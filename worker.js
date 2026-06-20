// Cloudflare Worker — Research Methods Student Registration
// KV namespace: RM_STUDENTS (bind as RM_STUDENTS in Cloudflare dashboard)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // GET /students — return all registrations
    if (request.method === 'GET' && url.pathname === '/students') {
      const raw = await env.RM_STUDENTS.get('all', { type: 'json' });
      const students = raw || [];
      return new Response(JSON.stringify(students), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    // POST /register — add a student
    if (request.method === 'POST' && url.pathname === '/register') {
      try {
        const body = await request.json();
        const students = (await env.RM_STUDENTS.get('all', { type: 'json' })) || [];
        students.push(body);
        await env.RM_STUDENTS.put('all', JSON.stringify(students));
        return new Response(JSON.stringify({ ok: true, count: students.length }), {
          headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }
    }

    // DELETE /clear — admin reset (protect with secret in production)
    if (request.method === 'POST' && url.pathname === '/clear') {
      const body = await request.json().catch(() => ({}));
      if (body.secret !== 'drtan2025clear') {
        return new Response('Unauthorized', { status: 401, headers: CORS });
      }
      await env.RM_STUDENTS.put('all', JSON.stringify([]));
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  }
};
