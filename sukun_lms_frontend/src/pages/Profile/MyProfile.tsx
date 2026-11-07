import { useEffect, useState } from 'react'
import { useFormik } from 'formik';
import Card, { CardBody, CardFooter, CardFooterRight, CardHeader, CardLabel, CardTitle } from '../../components/bootstrap/Card';
import validateEmail from '../../helpers/emailValidator';
import UserFields from './UserFields';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import SaveIconButton from '../../components/CustomComponent/Buttons/SaveIconButton';

type ProfileApiRole = {
    id?: number;
    name?: string;
    description?: string;
};

type ProfileApiData = {
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: ProfileApiRole;
    user?: ProfileApiData;
};

const mapProfileToFormValues = (data: ProfileApiData) => {
    const profile = data?.user ?? data;

    return {
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        email: profile?.email ?? '',
        role: profile?.role?.name ?? '',
    };
};

const MyProfile = () => {
    const [waitingForAxios, setWaitingForAxios] = useState(false);
    const { showErrorNotification, showSuccessNotification } = useToasterNotification();
    const formik = useFormik({
        initialValues: {
            first_name: '',
            last_name: '',
            email: '',
            role: '',
        },
        validate: (values) => {
            const errors: any = {};
            const emailError = validateEmail(values.email);
            if (emailError) {
                errors.email = emailError;
            }
            if (!values.first_name) errors.first_name = '*Required';
            if (!values.email) errors.email = '*Required';
            if (!values.last_name) errors.last_name = '*Required';
            return errors;
        },
        onSubmit: (values) => {
            setWaitingForAxios(true)
            const payload = {
                first_name: values?.first_name || '',
                last_name: values?.last_name || '',
                email: values?.email || '',
            }
            const url = '/api/users/profile/'
            authAxios.patch(url, payload)
                .then((res) => {
                    setWaitingForAxios(false)
                    showSuccessNotification('Profile updated successfully')
                })
                .catch((err) => {
                    setWaitingForAxios(false)

                    showErrorNotification(err)
                })
        },
    });



    useEffect(() => {
        const url = `/api/users/profile/`

        authAxios.get(url)
            .then((res) => {
                formik.resetForm({
                    values: mapProfileToFormValues(res.data),
                });
            })
            .catch((err) => {
                showErrorNotification(err)

            })
    }, [])

    return (
        <Card stretch borderSize={2}>
            <CardHeader>
                <CardLabel icon='Contacts' iconColor='primary'>
                    <CardTitle tag='div' className='h5'>
                        My Profile
                    </CardTitle>
                </CardLabel>
            </CardHeader>
            <CardBody isScrollable>
                <UserFields
                    formik={formik}
                    waitingForAxios={waitingForAxios}
                    isAdd={false}
                    isProfile
                />
            </CardBody>
            <CardFooter>
                <CardFooterRight>
                    <SaveIconButton waitingForAxios={waitingForAxios} onClickfunc={formik.handleSubmit} isOnline />
                </CardFooterRight>
            </CardFooter>
        </Card>
    )
}

export default MyProfile
