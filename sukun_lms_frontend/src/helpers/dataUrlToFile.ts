import base64toFile from './base64toFile';

/** Convert a canvas/data-URL image string to a `File` for `FormData` uploads. */
export default function dataUrlToFile(
	dataUrl: string,
	filename = 'background_image.jpg',
): File {
	const blob = base64toFile(dataUrl) as Blob;
	const type = blob.type || 'image/jpeg';
	return new File([blob], filename, { type });
}
