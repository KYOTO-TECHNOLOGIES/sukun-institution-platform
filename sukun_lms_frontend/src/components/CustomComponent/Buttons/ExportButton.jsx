import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../bootstrap/Button';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../bootstrap/Dropdown';
import Spinner from '../../bootstrap/Spinner';
import { authAxios } from '../../../axiosInstance';
import pdfGenerator  from '../../../helpers/PDFReportGenerator';
import useToasterNotification from '../../../hooks/useToasterNotification';
import downloadHandler from '../../../helpers/DownloadCsv';


const ExportButton = ({ url, hiddenColumnsKey,name }) => {
	const {showErrorNotification}=useToasterNotification();
    const [isLoading,setIsloading]=useState(false)
	const handleExport = (report) => {
		setIsloading(true)
		let exportUrl = `${url.current}&${report}`;
		if(hiddenColumnsKey!==''||hiddenColumnsKey!==null){
			exportUrl+=`&excluded_columns=${localStorage.getItem(hiddenColumnsKey)}`
		}
		
		
		if(report==='pdf_download'){
			authAxios
			.get(exportUrl)
			.then((response) => {
				const headRowData = [response?.data?.header]
				const bodyRowData = response?.data?.body
				const doc = pdfGenerator(headRowData, bodyRowData, name)
				doc.save(`${name}.pdf`);
				setIsloading(false)
			})
			.catch((error) => {
				showErrorNotification(error)
				setIsloading(false)
			});
		}
		else{
			downloadHandler(exportUrl,`${name}.csv`,setIsloading)
		}
		
	};

	return (
						// @ts-ignore
			<Dropdown isAlignmentEnd={false} >
				<DropdownToggle>
					<Button icon='Download' color= 'secondary' isLight isDisable={isLoading}>
						{isLoading? <Spinner isSmall color='secondary' />:'Export'}
					</Button>
				</DropdownToggle>
				<DropdownMenu>
					<DropdownItem onClick={() => handleExport('pdf_download')}>
						Export PDF
					</DropdownItem>
					<DropdownItem onClick={() => handleExport('csv_download')}>
						Export CSV
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>

	);
};
/* eslint-disable react/forbid-prop-types */
ExportButton.propTypes = {
	url: PropTypes.any.isRequired,
	hiddenColumnsKey: PropTypes.any.isRequired,
	name:PropTypes.string.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default ExportButton;
