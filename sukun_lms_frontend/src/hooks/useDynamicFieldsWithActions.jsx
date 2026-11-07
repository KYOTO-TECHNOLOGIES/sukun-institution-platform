import React, { useEffect, useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Cookies from 'js-cookie';
// import { IconButton } from '@material-ui/core';
// import { Download } from '../components/icon/material-icons';
// import Download from '../components/icon/material-icons/Download';
import { Download } from '@mui/icons-material';
import { authAxios } from '../axiosInstance';
import Image from '../assets/img/Noimage.png';
// import fileDownloader from '../helpers/FileDownloader';
import Avatar from '../components/Avatar';
import { baseURL } from '../helpers/baseURL';
import fileDownloader from '../helpers/FileDownloaderForDynamicFields';

const useDynamicFieldsWithActions = ({
	oldValue,
	apiUrl,
	actionButtonsConfig,
	hiddenColumnArray,
}) => {
	// const [columns, setColumns] = useState(oldValue.map(data => ({...data,hidden: hiddenColumnArray.includes(data.field) ? true : false,
	// 	hiddenByColumnsButton: hiddenColumnArray.includes(data.field) ? true : false,})));
	const [columns, setColumns] = useState(
		oldValue.map((data) => ({
			...data,
			hidden: hiddenColumnArray.includes(data.field),
			hiddenByColumnsButton: hiddenColumnArray.includes(data.field),
		})),
	);
	const [mounted, setMounted] = useState(false);
	const tenant = Cookies.get('tenant');
	const UrlCreator = (value) => {
		let prefixURL;
		if (!import.meta.env.NODE_ENV || import.meta.env.NODE_ENV === 'development') {
			prefixURL = `${baseURL}/clients/`;
		} else {
			prefixURL = `${baseURL}/media/`;
		}
		if (typeof value === 'string') {
			const imageData = JSON.parse(value);

			return `${prefixURL}${tenant}${imageData.media_url}`;
		}
		return `${prefixURL}${tenant}${value.media_url}`;
	};

	// const getDisplayValueForField = (rowData, fieldDescription) => {
	// 	const fieldValue = rowData[fieldDescription];
	// 	if (!fieldValue) return '----';
	// 	if (Array.isArray(fieldValue) && fieldValue.length > 0) {
	// 		return fieldValue.map((obj) => obj.label).join(', ');
	// 	}
	// 	return fieldValue.toString() || '----';
	// };
	const getDisplayValueForField = (rowData, fieldDescription) => {
		let fieldValue = rowData[fieldDescription];

		// Check if fieldValue is a string and try to parse it as JSON
		if (typeof fieldValue === 'string') {
			try {
				const parsedValue = JSON.parse(fieldValue);
				// If parsing was successful and the result is an array, assign it to fieldValue
				if (Array.isArray(parsedValue)) {
					fieldValue = parsedValue;
				}
			} catch (e) {
				// If JSON parsing fails, we'll just proceed with the original fieldValue
			}
		}

		if (!fieldValue) return '----';

		if (Array.isArray(fieldValue) && fieldValue.length > 0) {
			// return fieldValue.map((obj) => obj).join(', ');

			if (typeof fieldValue[0] === 'object' && fieldValue[0].value) {
				return fieldValue.map((obj) => obj.label).join(', ');
			}
			return fieldValue.join(', ');
		}

		return fieldValue.toString() || '----';
	};

	const renderSingleOptiontField = (rowData, data) => {
		if (rowData[data.description]) {
			return typeof rowData[data.description] === 'string'
				? rowData[data.description]
				: rowData[data.description]?.value;
		}
		return '----';
	};
	const renderPhotoField = (rowData, data) => {
		if (rowData[data.description]) {
			return (
				<Tooltip arrow title='Click to download'>
					<Avatar
						srcSet={UrlCreator(rowData[data.description])}
						src={UrlCreator(rowData[data.description])}
						size={50}
						onClick={() =>
							fileDownloader(
								typeof rowData[data.description] === 'string'
									? JSON.parse(rowData[data.description])
									: rowData[data.description],
							)
						}
					/>
				</Tooltip>
			);
		}
		return <Avatar srcSet={Image} src={Image} size={50} />;
	};

	const renderDocumentField = (rowData, data) => {
		if (rowData[data.description]) {
			return (
				<Tooltip arrow title='Download document'>
					<IconButton
						onClick={() =>
							fileDownloader(
								typeof rowData[data.description] === 'string'
									? JSON.parse(rowData[data.description])
									: rowData[data.description],
							)
						}>
						<Download />
					</IconButton>
				</Tooltip>
			);
		}
		return 'No file available';
	};

	const renderFieldBasedOnType = (rowData, data) => {
		switch (data.type_of_field) {
			case 'Photo':
				return renderPhotoField(rowData, data);
			case 'Document':
				return renderDocumentField(rowData, data);
			case 'Single Option':
				return renderSingleOptiontField(rowData, data);
			default:
				return getDisplayValueForField(rowData, data.description);
		}
	};

	/* eslint-disable no-nested-ternary */
	const handleApiResponse = (responseData) => {
		return responseData.map((data) => ({
			title: data.description,
			field: data.description,
			width: 'auto',
			is_dynamic: true,
			hidden: hiddenColumnArray.includes(data.description),
			hiddenByColumnsButton: hiddenColumnArray.includes(data.description),
			type:
				data.type_of_field === 'Number'
					? 'numeric'
					: data.type_of_field === 'Date'
						? 'date'
						: 'string',
			sorting: !(
				data.type_of_field === 'Multiple Options' ||
				data.type_of_field === 'Photo' ||
				data.type_of_field === 'Document'
			),
			filtering: !(data.type_of_field === 'Document' || data.type_of_field === 'Photo'),
			lookup:
				data.type_of_field === 'Multiple Options' || data.type_of_field === 'Single Option'
					? data.options.reduce((acc, option) => {
							acc[option.value] = option.value;
							return acc;
						}, {})
					: data.type_of_field === 'Yes or no question'
						? { Yes: 'Yes', No: 'No' }
						: null,
			render: (rowData) => renderFieldBasedOnType(rowData, data),
		}));
	};
	/* eslint-enable no-nested-ternary */

	// useEffect(() => {
	// 	if (!mounted) {
	// 		const fetchDynamicFields = async () => {
	// 			try {
	// 				const response = await authAxios.get(apiUrl);
	// 				const columnsToAdd = await handleApiResponse(response.data);
	// 				setColumns((prev) => [...prev, ...columnsToAdd, ...actionButtonsConfig]);
	// 			} catch (error) {
	// 				// Handle the error appropriately
	// 			}
	// 		};

	// 		fetchDynamicFields();
	// 	}
	// 	setMounted(true);
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, []);

	return columns;
};

export default useDynamicFieldsWithActions;
