import decodeAVIF, { init as initAvifWasm } from '@jsquash/avif/decode';
import decodeJpeg, { init as initJpegWasm } from '@jsquash/jpeg/decode';
import decodePng, { init as initPngWasm } from '@jsquash/png/decode';
import encodeWebp, { init as initWebpWasm } from '@jsquash/webp/encode';
import resize, { initResize } from '@jsquash/resize';
//
// @Note, We need to manually import the WASM binaries below so that we can use them in the worker
// CF Workers do not support dynamic imports
//
import RESIZE_WASM from '../../node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm';
// decode
import JPEG_DEC_WASM from '../../node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm';
import PNG_DEC_WASM from '../../node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm';
import AVIF_DNC_WASM from '../../node_modules/@jsquash/avif/codec/dec/avif_dec.wasm';
// encode
import WEBP_ENC_WASM from '../../node_modules/@jsquash/webp/codec/enc/webp_enc_simd.wasm';
//
export const decodeImage = async(buffer, format) => {
	if (format === 'jpeg' || format === 'jpg') {
		// @Note, we need to manually initialise the wasm module here from wasm import at top of file
		await initJpegWasm(JPEG_DEC_WASM);
		return decodeJpeg(buffer);
	} else if (format === 'png') {
		// @Note, we need to manually initialise the wasm module here from wasm import at top of file
		await initPngWasm(PNG_DEC_WASM);
		return decodePng(buffer);
	} else if (format === 'avif') {
		await initAvifWasm(AVIF_DNC_WASM);
		return decodeAVIF(buffer);
	}
	throw new Error(`Unsupported format: ${format}`);
};
// 修改图片大小的函数
export const resizeImage = async(imageData, options = { width: 1280, height: 720, fitMethod: 'contain' }) => {
	await initResize(RESIZE_WASM);
	return await resize(imageData, options);
};
//
// 添加将 JPEG 转换为 Webp 的函数
async function convertJpegToWebp(jpegFile) {
	try {
		const jpegBuffer = await jpegFile.arrayBuffer();
		const imageData = await decodeJpeg(jpegBuffer);
		await initWebpWasm(WEBP_ENC_WASM);
		return await encodeWebp(imageData, { quality: 85 });
	} catch (error) {
		console.error('JPEG 转换失败:', error);
		throw error;
	}
}
// 添加将 PNG 转换为 Webp 的函数
async function convertPngToWebp(pngFile) {
	try {
		const pngBuffer = await pngFile.arrayBuffer();
		const imageData = await decodePng(pngBuffer);
		await initWebpWasm(WEBP_ENC_WASM);
		return await encodeWebp(imageData, { quality: 85 });
	} catch (error) {
		console.error('PNG 转换失败:', error);
		throw error;
	}
}
// 添加将 AVIF 转换为 Webp 的函数
async function convertAvifToWebp(avifFile) {
	try {
		const avifBuffer = await avifFile.arrayBuffer();
		const imageData = await decodeAVIF(avifBuffer);
		await initWebpWasm(WEBP_ENC_WASM);
		return await encodeWebp(imageData, { quality: 85 });
	} catch (error) {
		console.error('AVIF 转换失败:', error);
		throw error;
	}
}
//
export async function formatToWebp(imageData) {
	try {
		await initWebpWasm(WEBP_ENC_WASM);
		return await encodeWebp(imageData, { quality: 85 });
	} catch (e) {
	}
}
