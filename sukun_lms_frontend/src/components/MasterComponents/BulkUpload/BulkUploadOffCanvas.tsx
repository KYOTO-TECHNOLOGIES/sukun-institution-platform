import React, { useState } from 'react';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import useToasterNotification from '../../../hooks/useToasterNotification';
import { authAxiosFileUpload } from '../../../axiosInstance';
import OffCanvasComponent from '../../OffCanvasComponent';
import Card, { CardBody } from '../../bootstrap/Card';
import SaveButton from '../../CustomComponent/Buttons/SaveButton';
import ImportInstructions from '../../CustomComponent/ImportInstructions';
import FormGroup from '../../bootstrap/forms/FormGroup';



const BulkUpload = ({ isOpen, setIsOpen, tableRef, title,api,fileName }:any) => {
	const {showErrorNotification,showSuccessNotification}=useToasterNotification();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm();

	const formatKey = (key:any) => {
		return key
		  .replace(/_/g, " ") // Replace underscores with spaces
		  .replace(/^./, (char:any) => char.toUpperCase());};

	const [waitingForAxios, setwaitingForAxios] = useState(false);
	const [uploadError, setUploadError] = useState('');
	const [warnings, setWarnings] = useState('');
	const [message, setmessage] = useState('');

	const onSubmit = (data:any) => {
		const payload = {csv_file:data.file[0]  };
		setwaitingForAxios(true);
		authAxiosFileUpload
			.post(api, payload)
			.then((res) => {
				setmessage(res.data.message)
				if(res.data.errors||res.data.warnings){
					  setUploadError(res.data.errors)
					  setWarnings(res.data.warnings	)
				}
				else{
				  setIsOpen(false);
				  showSuccessNotification(res.data.message)
				}
				

				setwaitingForAxios(false);
				tableRef.current.onQueryChange();
			})
			.catch((err) => {
				setwaitingForAxios(false);
			
				showErrorNotification(err)
			});
	};

	const renderComponent = () => {
		return (
		  <>
			{/* Render Upload Error Section */}
			{uploadError && (
			  <Card>
				<CardBody>
				<div style={{ width:'100%',}}  >
				<p >Message : {message}</p>

				</div>
				  <div style={{ color: 'red' }}>
				
					<h5>Error</h5>
					<ul>
					  {Object.entries(uploadError).map(([key, value]) => (
						<li key={key}>
						  {key}:
						 { /* eslint-disable no-nested-ternary */}

						  {Array.isArray(value) ? (
							<ul>
								{/* eslint-disable react/no-array-index-key */}
							  {value.map((item, index) => (
								<li key={index}>
								  {Object.entries(item).map(([nestedKey, nestedValue]) => (
									<div key={nestedKey}>
									  {formatKey(nestedKey)}: {nestedValue}
									</div>
								  ))}
								  {/* eslint-enable react/no-array-index-key */}
								</li>
							  ))}
							</ul>
						  ) : typeof value === 'object' && value !== null ? (
							<ul>
							  {Object.entries(value).map(([nestedKey, nestedValue]) => (
								<li key={nestedKey}>
								  {formatKey(nestedKey)}: {nestedValue}
								</li>
							  ))}
							</ul>
						  ) : (
							value
						  )}
						</li>
					  ))}
					</ul>
				  </div>
				  {	/* eslint-enable no-nested-ternary */
				  }
				</CardBody>
			  </Card>
			)}
	  
			{/* Render Warnings Section */}
			{warnings && (
			  <Card>
				<CardBody>
				  <div style={{ color: 'red' }}>
					<h5>Warnings</h5>
					{warnings}
				  </div>
				</CardBody>
			  </Card>
			)}
	  
			{/* Default Form */}
			{!uploadError && !warnings && (
			  <Form onSubmit={handleSubmit(onSubmit)}>
				<Card>
				  <CardBody>
					<ImportInstructions api={api} fileName={fileName} />
					<FormGroup label="">
					  <input
						type="file"
						className="form-control"
						{...register('file', {
						  required: true,
						})}
					  />
					  {errors?.file?.type === 'required' ? (
						<span style={{ color: 'red' }}>*This field is required</span>
					  ) : (
						<p />
					  )}
					</FormGroup>
					<div className="row m-0">
					  <div className="col-12 p-3">
						<SaveButton state={waitingForAxios} />
					  </div>
					</div>
				  </CardBody>
				</Card>
			  </Form>
			)}
		  </>
		);
	  };
	  

	return (
		<OffCanvasComponent isOpen={isOpen} placement='end' title={title} setOpen={setIsOpen}>	
			{renderComponent()}
		</OffCanvasComponent>
	);
};


export default BulkUpload;
