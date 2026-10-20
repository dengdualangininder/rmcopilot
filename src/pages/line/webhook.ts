import type { APIRoute } from "astro";

export const prerender = false;

const HOP_BY_HOP = [
	"host",
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"transfer-encoding",
	"upgrade",
	"content-length",
	"cf-connecting-ip",
	"cf-connecting-ipv6",
	"cf-ray",
	"cf-ipcountry",
	"cf-visitor",
	"cf-worker",
	"x-forwarded-for",
	"x-forwarded-proto",
	"x-forwarded-host",
	"x-real-ip",
];

async function proxy(request: Request, locals: App.Locals): Promise<Response> {
	const env = (locals as unknown as { runtime?: { env?: Record<string, unknown> } })
		.runtime?.env;
	const vpc = env?.LINE_VPC as
		| { fetch: (input: Request) => Promise<Response> }
		| undefined;

	if (!vpc) {
		return new Response("VPC binding LINE_VPC is not configured", {
			status: 500,
		});
	}

	const url = new URL(request.url);
	const target = new URL(`http://localhost:8646${url.pathname}${url.search}`);

	const headers = new Headers(request.headers);
	for (const name of HOP_BY_HOP) headers.delete(name);

	const hasBody = request.method !== "GET" && request.method !== "HEAD";
	const body = hasBody ? await request.arrayBuffer() : undefined;

	const upstream = await vpc.fetch(
		new Request(target, { method: request.method, headers, body }),
	);

	const responseHeaders = new Headers(upstream.headers);
	for (const name of HOP_BY_HOP) responseHeaders.delete(name);
	responseHeaders.delete("content-encoding");

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders,
	});
}

export const POST: APIRoute = ({ request, locals }) => proxy(request, locals);
export const GET: APIRoute = ({ request, locals }) => proxy(request, locals);
export const HEAD: APIRoute = ({ request, locals }) => proxy(request, locals);
