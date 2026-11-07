// export default function base64toFile(b64Data) {
// 	const BASE64_MARKER = ';base64,';
// 	const parts = b64Data.split(BASE64_MARKER);
// 	const contentType = parts[0].split(':')[1];
// 	const raw = window.atob(parts[1]);
// 	const rawLength = raw.length;
// 	const uInt8Array = new Uint8Array(rawLength);

// 	for (let i = 0; i < rawLength; ++i) {
// 		uInt8Array[i] = raw.charCodeAt(i);
// 	}

// 	return new Blob([uInt8Array], { type: contentType });
// }

export default function base64toFile(b64Data) {
	const BASE64_MARKER = ';base64,';
	const parts = b64Data.split(BASE64_MARKER);
	const contentType = parts[0].split(':')[1];
	const raw = window.atob(parts[1]);
	const rawLength = raw.length;
	const uInt8Array = new Uint8Array(rawLength);

	for (let i = 0; i < rawLength; i += 1) {
		// Adjusted here
		uInt8Array[i] = raw.charCodeAt(i);
	}

	return new Blob([uInt8Array], { type: contentType });
}
