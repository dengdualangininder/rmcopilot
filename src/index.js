const DROP_HEADERS = [
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

async function proxy(request, binding, port) {
	if (!binding || typeof binding.fetch !== "function") {
		return new Response(`VPC binding is not configured (port ${port})`, {
			status: 500,
		});
	}

	const url = new URL(request.url);
	const target = new URL(`http://localhost:${port}${url.pathname}${url.search}`);

	const headers = new Headers(request.headers);
	for (const name of DROP_HEADERS) headers.delete(name);

	const hasBody = request.method !== "GET" && request.method !== "HEAD";

	const upstream = await binding.fetch(
		new Request(target, {
			method: request.method,
			headers,
			body: hasBody ? request.body : undefined,
			redirect: "manual",
		}),
	);

	const responseHeaders = new Headers(upstream.headers);
	for (const name of DROP_HEADERS) responseHeaders.delete(name);
	responseHeaders.delete("content-encoding");

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders,
	});
}

export default {
	async fetch(request, env) {
		const { pathname } = new URL(request.url);

		// LINE Messaging API webhook → Hermes gateway on the VM (port 8646).
		if (pathname === "/line/webhook" || pathname.startsWith("/line/webhook/")) {
			return proxy(request, env.LINE_VPC, 8646);
		}

		// Everything else → 理專副駕平台 (FastAPI + SQLite, port 8787).
		return proxy(request, env.PLATFORM_VPC, 8787);
	},
};
