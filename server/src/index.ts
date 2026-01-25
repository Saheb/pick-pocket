export interface Env {
    PICK_POCKET_IDEAS_KV: KVNamespace;
    RESEND_API_KEY: string;
    RECIPIENT_EMAIL: string;
}

interface Idea {
    text: string;
    url: string;
    timestamp: string;
}

// CORS headers for extension
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);

        // POST /sync - receive ideas from extension
        if (request.method === 'POST' && url.pathname === '/sync') {
            return handleSync(request, env);
        }

        // GET /ideas - list stored ideas (for debugging)
        if (request.method === 'GET' && url.pathname === '/ideas') {
            return handleListIdeas(env);
        }

        // DELETE /sync - remove idea from server
        if (request.method === 'DELETE' && url.pathname === '/sync') {
            return handleDelete(request, env);
        }

        // POST /send-digest - manually trigger email
        if (request.method === 'POST' && url.pathname === '/send-digest') {
            return handleSendDigest(env);
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    },

    // Weekly cron trigger
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        await sendWeeklyDigest(env);
    },
};

async function handleSendDigest(env: Env): Promise<Response> {
    try {
        const result = await sendWeeklyDigest(env);
        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

async function handleSync(request: Request, env: Env): Promise<Response> {
    try {
        const ideas: Idea[] = await request.json();

        if (!Array.isArray(ideas) || ideas.length === 0) {
            return new Response(JSON.stringify({ error: 'No ideas provided' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Get existing ideas
        const existingRaw = await env.PICK_POCKET_IDEAS_KV.get('pending_ideas');
        const existing: Idea[] = existingRaw ? JSON.parse(existingRaw) : [];

        // Deduplicate by timestamp+text
        const existingKeys = new Set(existing.map((i) => `${i.timestamp}-${i.text}`));
        const newIdeas = ideas.filter((i) => !existingKeys.has(`${i.timestamp}-${i.text}`));

        // Merge and store
        const merged = [...existing, ...newIdeas];
        await env.PICK_POCKET_IDEAS_KV.put('pending_ideas', JSON.stringify(merged));

        return new Response(JSON.stringify({ synced: newIdeas.length, total: merged.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

async function handleListIdeas(env: Env): Promise<Response> {
    const raw = await env.PICK_POCKET_IDEAS_KV.get('pending_ideas');
    const ideas: Idea[] = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify(ideas, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function handleDelete(request: Request, env: Env): Promise<Response> {
    try {
        const { timestamp, url } = await request.json() as { timestamp: string; url: string };

        if (!timestamp) {
            return new Response(JSON.stringify({ error: 'timestamp required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Get existing ideas
        const existingRaw = await env.PICK_POCKET_IDEAS_KV.get('pending_ideas');
        const existing: Idea[] = existingRaw ? JSON.parse(existingRaw) : [];

        // Filter out the matching idea
        const filtered = existing.filter((i) => i.timestamp !== timestamp);
        const deleted = existing.length - filtered.length;

        // Save back
        await env.PICK_POCKET_IDEAS_KV.put('pending_ideas', JSON.stringify(filtered));

        return new Response(JSON.stringify({ deleted, remaining: filtered.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

async function sendWeeklyDigest(env: Env): Promise<{ sent: boolean; message: string }> {
    const raw = await env.PICK_POCKET_IDEAS_KV.get('pending_ideas');
    const ideas: Idea[] = raw ? JSON.parse(raw) : [];

    if (ideas.length === 0) {
        console.log('No ideas to send this week.');
        return { sent: false, message: 'No ideas to send' };
    }

    // Build email HTML
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const htmlContent = `
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #667eea;">💡 Your Weekly Ideas Digest</h1>
        <p style="color: #666;">Here are the ${ideas.length} ideas you picked this week:</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        ${ideas
            .map(
                (idea) => `
          <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.5;">${escapeHtml(idea.text)}</p>
            <a href="${escapeHtml(idea.url)}" style="color: #667eea; font-size: 14px; text-decoration: none;">
              🔗 Source
            </a>
            <span style="color: #999; font-size: 12px; margin-left: 12px;">
              ${new Date(idea.timestamp).toLocaleDateString()}
            </span>
          </div>
        `
            )
            .join('')}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Sent by Pick Pocket 💜</p>
      </body>
    </html>
  `;

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Pick Pocket <onboarding@resend.dev>', // Use your verified domain later
            to: env.RECIPIENT_EMAIL,
            subject: `💡 Weekly Ideas Digest - ${ideas.length} picks`,
            html: htmlContent,
        }),
    });

    if (response.ok) {
        console.log('Weekly digest sent successfully!');
        // Clear pending ideas after sending
        await env.PICK_POCKET_IDEAS_KV.put('pending_ideas', '[]');
        return { sent: true, message: `Digest sent with ${ideas.length} ideas` };
    } else {
        const error = await response.text();
        console.error('Failed to send email:', error);
        throw new Error('Failed to send email: ' + error);
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
