import React, { useEffect, useState } from 'react';
import FormGroup from '../../../bootstrap/forms/FormGroup';
import Card, { CardBody, CardFooter, CardFooterRight, CardHeader, CardLabel, CardTitle } from '../../../bootstrap/Card';
import Button from '../../../bootstrap/Button';
import { Spinner } from 'reactstrap';
import { authAxios } from '../../../../axiosInstance';
// import useToasterNotification from '../../../../hooks/useToasterNotification';
import ReactSelectComponent from '../../../CustomComponent/Select/ReactSelectComponent';

const UserFields = ({ register, errors,watch, control, getValues, setValue, handleSubmit, waitingForAxios, isAdd, isProfile = false }) => {
    // const { showErrorNotification } = useToasterNotification();
    // const partyType = watch('party_type');
    const renderError = (fieldName) => {
        if (errors[fieldName]?.type === "required") {
            return <span className="field-required-class">*Required</span>;
        }
        if (errors[fieldName]?.type === "pattern") {
            return <span className="field-required-class">*{errors[fieldName]?.message?.toString()}</span>;
        }
        return <></>;
    };
    // const [options, setOptions] = useState([]);
    // const [optionsLoading, setOptionsLoading] = useState(false);
    const [designationOptions, setDesignationOptions] = useState([]);



    // const fetchData = async (type: string) => {
    //     if(type){
    //     setValue('establishment_gtcc', null);
    //     setOptionsLoading(true);
    //     setOptions([]);
    //     let response;
    //     try {
    //         switch (type) {
    //             case 'Establishment':
    //                 response = await authAxios.get('/region/establishments/?pagination=false&minimal=true');
    //                 setOptions(response.data.map((data) => ({
    //                     label: data.establishment_name,
    //                     value: data.id,
    //                 })));
    //                 break;
    //             case 'GTCC':
    //                 response = await authAxios.get('/region/gtccs/?pagination=false&minimal=true');
    //                 setOptions(response.data.map((data) => ({
    //                     label: data.name,
    //                     value: data.id,
    //                 })));
    //                 break;
    //             default:
    //                 break;
    //         } 
    //     } catch (error) {
    //         showErrorNotification(error);
    //     }finally{
    //         setOptionsLoading(false);
    //     }
    // }
    // }


    useEffect(() => {
        // fetchData(partyType);

        const fetchDesignationOptions = async () => {
            const response = await authAxios.get('/users/designations/?status=Active&pagination=false&minimal=true&status=Active');
            setDesignationOptions(response.data.map((item: any) => ({
                label: item.name,
                value: item.id,
            })));
        }
        fetchDesignationOptions();
    }, []);

    return (
        <Card borderSize={2}>
            <CardHeader>
                <CardLabel icon='Edit' iconColor='warning'>
                    <CardTitle tag='div' className='h5'>
                        Personal Information
                    </CardTitle>
                </CardLabel>
            </CardHeader>
            <CardBody>
                <div className='row g-4'>
                   
                    <div className='col-12 col-md-6'>
                        <FormGroup label='First Name'>
                            <input
                                type='text'
                                className={errors?.first_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                placeholder='First Name'
                                autoComplete='family-name'
                                {...register("first_name", {
                                    required: true,
                                })}
                            />
                            {renderError('first_name')}
                        </FormGroup>
                    </div>
                    <div className='col-12 col-md-6'>
                        <FormGroup label='Last Name'>
                            <input
                                type='text'
                                className={errors?.last_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                placeholder='Last Name'
                                autoComplete='family-name'
                                {...register("last_name", {
                                    required: true,
                                })}
                            />
                            {renderError('last_name')}
                        </FormGroup>
                    </div>
                    <div className='col-12 col-md-6'>
                    <ReactSelectComponent
                            control={control}
                            name='Designation'
                            placeholder='Select Designation'
                            field_name="designation"
                            getValues={getValues}
                            errors={errors}
                            options={designationOptions}
                            // isRequired={true}
                            isClearable={true}
                        />

                    </div>
                    <div className='col-lg-6'>
                        <FormGroup label='Email Address'>
                            <input
                                type='email'
                                className={errors?.email?.type === "required" || errors?.email?.type === "pattern" ? 'form-control is-invalid' : 'form-control'}
                                placeholder='Email Address'
                                autoComplete='email'
                                disabled={!isAdd}
                                {...register("email", {
                                    required: true,
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address",
                                    },
                                })}
                            />
                            {renderError('email')}
                        </FormGroup>
                    </div>


                    <div className='col-12 col-md-6'>
                        <FormGroup label='Alternate Email Address'>
                            <input
                                type='email'
                                className={errors?.alternate_email?.type === "pattern" ? 'form-control is-invalid' : 'form-control'}
                                placeholder='Alternate Email Address'
                                autoComplete='alternate_email'
                                {...register("alternate_email", {
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address",
                                    },
                                })}
                            />
                            {renderError('alternate_email')}
                        </FormGroup>
                    </div>
                   
                        <div className='col-12 col-md-6'>
                            <FormGroup label='Personal Contact Number'>
                                <input
                                    type='number'
                                    className={errors?.personal_contact_number?.type === "pattern" ? 'form-control is-invalid' : 'form-control'}
                                    placeholder='Personal Contact Number'
                                    autoComplete='peronalconatctnumber'
                                    onInput={(e: any) => e.target.value = e.target.value.slice(0, 10)}
                                    onWheel={(e: any) => e.target.blur()}
                                    {...register("personal_contact_number", {
                                        pattern: {
                                            value: /^[0-9]+$/,
                                            message: "Invalid contact number",
                                        },
                                    })}
                                />
                                {renderError('personal_contact_number')}
                            </FormGroup>
                        </div>
                        <div className='col-12 col-md-6'>
                        <FormGroup label='Office Contact Number'>
                            <input
                                type='number'
                                className='form-control'
                                placeholder='Office Contact Number'
                                autoComplete='contactnuber'
                                onInput={(e: any) => e.target.value = e.target.value.slice(0, 10)}
                                onWheel={(e: any) => e.target.blur()}
                                {...register("office_contact_number")}
                            />
                            {renderError('office_contact_number')}
                        </FormGroup>
                    </div>
                    {/* <div className='col-12 col-md-6'>
                        <FormGroup label='Party Type'>
                            <select
                                className={errors?.party_type?.type === "required" ? 'form-control is-invalid' : 'form-control'}
                                {...register("party_type", {
                                    required: true,
                                    onChange: (e) => {
                                        fetchData(e.target.value);
                                    },
                                })}
                            >
                                <option value="Region">Region</option>
                                <option value="GTCC">GTCC</option>
                                <option value="Establishment">Establishment</option>
                                <option value="Authority">Authority</option>
                            </select>
                            {renderError('party_type')}
                        </FormGroup>
                    </div>
                    <div className='col-12 col-md-6'>
                    {['Establishment', 'GTCC'].includes(partyType) && (
                        <ReactSelectComponent
                            control={control}
                            name={partyType}
                            field_name="establishment_gtcc"
                            getValues={getValues}
                            errors={errors}
                            isLoading={optionsLoading}
                            options={options}
                            isRequired={true}
                            isClearable={true}
                        />)
                }
                    </div> */}
                </div>
            </CardBody>
            {(!isAdd && !isProfile) &&
                <CardFooter>
                    <CardFooterRight>
                        <Button
                            color='primary'
                            icon={waitingForAxios ? '' : 'Save'}
                            isDisable={waitingForAxios}
                            className='mt-2'
                            isOutline
                            type='submit'
                            onClick={handleSubmit}>
                            {waitingForAxios ? <Spinner size='sm' /> : 'Save'}
                        </Button>
                    </CardFooterRight>
                </CardFooter>
            }

        </Card>

    );
};

export default UserFields;
