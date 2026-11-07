import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Spinner } from 'reactstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Card, { CardBody, CardFooter, CardFooterRight, CardHeader, CardLabel, CardTitle } from '../../../../components/bootstrap/Card';
import ProfilePicUpload from '../../../CustomComponent/ProfilePicUpload';
import UserFields from './UserFields'
import ChangePassword from './ChangePassword';
import Button from '../../../bootstrap/Button';
import { authAxios } from '../../../../axiosInstance';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import { setUserDetails } from '../../../../store/user';
import ProfilePicUploadWithState from '../../../CustomComponent/ProfilePicUploadWithState';

const UserDetails = ({ isAdd = false, }) => {
    const { id } = useParams()
    const [image, setImage] = useState<any>(null);
    const [waitingForAxios, setWaitingForAxios] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { showErrorNotification, showSuccessNotification } = useToasterNotification();
    const userData = useSelector((state: any) => state.UserSlice.user_details)

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        getValues,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            party_type: 'Region',
            personal_contact_number: '',
            office_contact_number: '',
            alternate_email: '',
            establishment_gtcc: null,
            designation: null,
        }
    });

    const onSubmit = (values) => {
        setWaitingForAxios(true)

        const payload: any = {
            "first_name": values?.first_name || '',
            "last_name": values?.last_name || '',
            "email": values?.email || '',
            "office_contact_number": values?.office_contact_number || '',
            "personal_contact_number": values?.personal_contact_number || '',
            "alternate_email": values?.alternate_email || '',
            'party_type': values?.party_type || '',
            'designation': values?.designation?.value || null,


        }
        // if (values?.party_type === 'Establishment') {
        //     payload.establishment_id = values.establishment_gtcc.value;
        // }
        // if (values?.party_type === 'GTCC') {
        //     payload.gtcc_id = values.establishment_gtcc.value;
        // }
        if (!image?.includes('http')) {
            payload.avatar = image;
        }
        const url = `/users/accounts/${!isAdd ? id : ''}`
        const putUrl = `/users/user/${id}/`

        const axiosMethod = isAdd
            ? authAxios.post(url, payload)
            : authAxios.put(putUrl, payload);

        axiosMethod
            .then((res) => {
                setWaitingForAxios(false)
                if (isAdd) {
                    navigate('/usermanagement')
                } else {
                    dispatch(setUserDetails(res.data))
                    showSuccessNotification('User updated successfully')
                }

            })
            .catch((err) => {
                setWaitingForAxios(false)
                showErrorNotification(err)

            })
    };

    useEffect(() => {

        if (!isAdd) {
            reset({
                first_name: userData?.first_name || '',
                last_name: userData?.last_name || '',
                office_contact_number: userData?.office_contact_number || '',
                email: userData?.email || '',
                personal_contact_number: userData?.personal_contact_number || '',
                alternate_email: userData?.alternate_email || '',
                // party_type: userData?.party_type || 'Region',
                // establishment_gtcc: userData?.party_type === 'Establishment' ? {label: userData?.establishment?.establishment_name, value: userData?.establishment?.id} : userData?.party_type === 'GTCC' ? {label: userData?.gtcc?.name, value: userData?.gtcc?.id} : null,
                designation: { label: userData?.designation?.name, value: userData?.designation?.id }
            })
            // fetchData(partyType);
            // setValue('establishment_gtcc', userData?.party_type === 'Establishment' ? {label: userData?.establishment?.establishment_name, value: userData?.establishment?.id} : userData?.party_type === 'GTCC' ? {label: userData?.gtcc?.name, value: userData?.gtcc?.id} : null);
            setImage(userData?.avatar || null)

        }



    }, [])




    return (
        <Card stretch borderSize={2}>
            <CardHeader>
                <CardLabel icon='Contacts' iconColor='primary'>
                    <CardTitle tag='div' className='h5'>
                        User Details
                    </CardTitle>
                </CardLabel>
            </CardHeader>
            <CardBody isScrollable>
                {!isAdd &&
                    <Card borderSize={2}>
                        <CardBody>

                            <div className='row g-4 align-items-center'>
                                <div className='col-xl-auto'>
                                    <ProfilePicUploadWithState setImage={setImage} image={image} />

                                </div>
                                <div className='col-xl'>
                                    <div className='row g-4'>
                                        <div className='col-12'>
                                            <p className='lead text-muted'>
                                                Profile picture, allows for better visualization, fostering improved communication

                                            </p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>}
                <UserFields
                    register={register}
                    errors={errors}
                    watch={watch}
                    control={control}
                    getValues={getValues}
                    setValue={setValue}
                    handleSubmit={handleSubmit(onSubmit)}
                    waitingForAxios={waitingForAxios}
                    isAdd={isAdd}
                />
                {!isAdd && <ChangePassword changePasswordApi={`/users/user/${id}/reset-password/`} />}

            </CardBody>
            {isAdd &&
                <CardFooter>
                    <CardFooterRight>
                        <Button
                            color='primary'
                            icon={waitingForAxios ? '' : 'Save'}
                            isDisable={waitingForAxios}
                            className='mt-2'
                            isOutline
                            type='submit'
                            onClick={handleSubmit(onSubmit)}>
                            {waitingForAxios ? <Spinner size='sm' /> : 'Save'}
                        </Button>
                    </CardFooterRight>
                </CardFooter>}
        </Card>
    )
}

export default UserDetails
