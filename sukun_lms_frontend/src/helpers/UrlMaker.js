import { baseURL } from './baseURL';


const urlMaker = (image, type) => {
	let fileName;

	// Generate URL based on type
	switch (type) {
		
		default:
			[, fileName] = image.split(`${type}/`);
			return `${baseURL}/media/${type}/${fileName}`;
	}
};

export default urlMaker;

