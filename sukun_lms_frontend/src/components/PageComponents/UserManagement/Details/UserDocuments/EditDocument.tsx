import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import Modal, {
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from '../../../../bootstrap/Modal';
import Button from '../../../../bootstrap/Button';
import { authAxios, authAxiosFileUpload } from '../../../../../axiosInstance';
import SaveIconButton from '../../../../CustomComponent/Buttons/SaveIconButton';
import useToasterNotification from '../../../../../hooks/useToasterNotification';
import FormGroup from '../../../../bootstrap/forms/FormGroup';
import ReactSelectComponent from '../../../../CustomComponent/Select/ReactSelectComponent';

const EditDocument = ({ isOpen, setIsOpen, title, tableRef, item }) => {
    const { id } = useParams();
    const {
        register,
        handleSubmit,
        control,
        getValues,
        reset,
        formState: { errors },
    } = useForm();
    const [waitingForAxios, setWaitingForAxios] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { showSuccessNotification, showErrorNotification } = useToasterNotification();
    const [documentTypes, setDocumentTypes] = useState([]);
    useEffect(() => {
        authAxios.get('/users/document-types/?pagination=false&minimal=true&status=Active')
            .then((response) => {
                setDocumentTypes(response.data.map((item: any) => ({
                    label: item.name,
                    value: item.id,
                })));
            })
            .catch((error) => {
                showErrorNotification(error);
            })
            .finally(() => {
                setIsLoading(false);
            });

        if (item) {
            reset({ ...item, document_type: { value: item.document_type.id, label: item.document_type.name }, document_file: null });
        }
    }, []);


    const onSubmit = (data) => {
        let payload: any = {
            document_type_id: data.document_type.value,
            document_number: data.document_number,
            issued_date: data.issued_date,
            expiry_date: data.expiry_date,
            user_id: id,
        }
        if (data.document_file) {
            payload.document_file = data.document_file[0];
        }


        const url = `/users/documents/${item.id}/`;
        setWaitingForAxios(true);
        authAxiosFileUpload
            .put(url, payload)
            .then(() => {
                setWaitingForAxios(false);
                tableRef.current.onQueryChange();
                showSuccessNotification("Document Updated Successfully");
                setIsOpen(false);

            })
            .catch((error) => {
                setWaitingForAxios(false);
                showErrorNotification(error);
            });
    };

    const renderError = (fieldName) => {
        if (errors[fieldName]?.type === "required") {
            return <span className="field-required-class">*Required</span>;
        }
        return <></>;
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered>
            <ModalHeader className='p-4' setIsOpen={setIsOpen}>
                <ModalTitle id='modaladdgtcc'>{title}</ModalTitle>
            </ModalHeader>
            <ModalBody className='d-flex flex-column gap-3 px-5 pb-5'>
                <ReactSelectComponent
                    control={control}
                    name="Document Type"
                    field_name="document_type"
                    isLoading={isLoading}
                    getValues={getValues}
                    errors={errors}
                    placeholder="Select Document Type"
                    isRequired
                    isClearable
                    options={documentTypes}
                />
                <div>
                    <FormGroup label="Document Number">
                        <input
                            type="text"
                            placeholder="Document Number"
                            className={errors?.document_number?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                            {...register("document_number", { required: true })}
                        />
                        {renderError('document_number')}
                    </FormGroup>
                </div>

                <div>
                    <FormGroup label="Issued Date">
                        <input
                            type="date"
                            className={errors?.issued_date?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                            {...register("issued_date", { required: true })}
                        />
                        {renderError('issued_date')}
                    </FormGroup>
                </div>
                <div>
                    <FormGroup label="Expiry Date">
                        <input
                            type="date"
                            className={errors?.expiry_date?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                            {...register("expiry_date", { required: true })}
                        />
                        {renderError('expiry_date')}
                    </FormGroup>
                </div>
                <div>
                    <FormGroup label="Document File">
                        <input type="file" className='form-control' {...register("document_file")} />
                    </FormGroup>
                </div>
            </ModalBody>

            <ModalFooter className='px-4 pb-4'>
                <>
                    <Button
                        color='danger'
                        icon='Close'
                        className='me-2'
                        onClick={() => setIsOpen(false)}
                    >
                        Close
                    </Button>
                    <div>
                        <SaveIconButton
                            waitingForAxios={waitingForAxios}
                            onClickfunc={() => handleSubmit(onSubmit)()}
                        />

                    </div>
                </>
            </ModalFooter>
        </Modal>
    );
};

export default EditDocument;
