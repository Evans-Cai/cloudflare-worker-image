import queryString from 'query-string';
import { decodeImage, formatToWebp, resizeImage } from 'functions/utils/jsquash.js';
//
const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;
const CDN_CACHE_AGE = 6 * MONTH_IN_SECONDS; // 6 Months
//
async function handleRequest(request, env, context) {
	try {
		console.log('request', request);
		// 判断请求方法
		const requestUrl = new URL(request.url);
		let { url = '', action = '', format = 'webp', quality = 99 } = queryString.parse(requestUrl.search);
		if (!url && request.method !== 'POST') {
			console.log('Not found', requestUrl);
			return new Response('Not found', { status: 404 });
		} else {
			url = requestUrl.origin + requestUrl.pathname
		}
		const extension = new URL(url).pathname.split('.').pop();
		const isWebpSupported = request.headers.get('accept').includes('image/webp');
		// const cacheKeyUrl = isWebpSupported ? requestUrl.toString().replace(`.${extension}`, '.webp') : requestUrl.toString();
		const cacheKey = new Request(requestUrl);
		const cache = caches.default;
		const supportedExtensions = ['jpg', 'jpeg', 'png', 'avif'];
		if (!supportedExtensions.includes(extension)) {
			return new Response(`<doctype html>
<title>Unsupported image format</title>
<h1>Unsupported image format or missing image path</h1>
<p>Supported formats: ${supportedExtensions.join(', ')}</p>
<p>For this @jSquash Cloudflare Worker example you need to specify the image url as a path, e.g. <a href="/jamie.tokyo/images/compressed/spare-magnets.jpg">https://&lt;worker-url&gt;/jamie.tokyo/images/compressed/spare-magnets.jpg</a></p>
    `, { status: 404, headers: { 'Content-Type': 'text/html' } });
		}
		//
		let response = await cache.match(cacheKey);
		if (!response) {
			// Assuming the pathname includes a full url, e.g. jamie.tokyo/images/compressed/spare-magnets.jpg
			if (request.method === 'POST') {
				response = new Response(request.body);
			} else {
				response = await fetch(url);
			}
			//
			if (response.status !== 200) {
				return new Response('Not found', { status: 404 });
			}
			if (isWebpSupported) {
				const imageData = await decodeImage(await response.arrayBuffer(), extension);
				const compressedImage = await resizeImage(imageData);
				// @Note, we need to manually initialise the wasm module here from wasm import at top of file
				const webpImage = await formatToWebp(compressedImage);
				response = new Response(webpImage, response);
				response.headers.set('Content-Type', 'image/webp');
			}
			response = new Response(response.body, response);
			response.headers.append('Cache-Control', `s-maxage=${CDN_CACHE_AGE}`);
			// Use waitUntil so you can return the response without blocking on
			// writing to cache
			context.waitUntil(cache.put(cacheKey, response.clone()));
		}
		return response;
	} catch (e) {
		return new Response('Method not allowed', { status: 405 });
	}
}
// 图片处理 入口
export default {
	//
	fetch: handleRequest
};
