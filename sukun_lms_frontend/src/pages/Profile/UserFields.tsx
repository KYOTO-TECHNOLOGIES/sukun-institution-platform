import Card, { CardBody, CardFooter, CardFooterRight, CardHeader, CardLabel, CardTitle } from '../../components/bootstrap/Card';
import Input from '../../components/bootstrap/forms/Input';
import Button from '../../components/bootstrap/Button';
import { Spinner } from 'reactstrap';
import FormGroup from '../../components/bootstrap/forms/FormGroup';

const UserFields = ({ formik, waitingForAxios, isAdd, isProfile = false }) => {
  
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
                        <FormGroup
                            id='first_name'
                            label='First Name'
                            isFloating>
                            <Input
                                placeholder='First Name'
                                autoComplete='family-name'
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.first_name}
                                isValid={formik.isValid}
                                isTouched={formik.touched.first_name}
                                invalidFeedback={formik.errors.first_name}
                            />

                        </FormGroup>
                    </div>
                    <div className='col-12 col-md-6'>
                        <FormGroup
                            id='last_name'
                            label='Last Name'
                            isFloating>
                            <Input
                                placeholder='Last Name'
                                autoComplete='family-name'
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.last_name}
                                isValid={formik.isValid}
                                isTouched={formik.touched.last_name}
                                invalidFeedback={formik.errors.last_name}
                            />
                        </FormGroup>
                    </div>
                    <div className='col-12 col-md-6'>
                        <FormGroup
                            id='email'
                            label='Email Address'
                            isFloating>
                            <Input
                                type='email'
                                placeholder='Email Address'
                                autoComplete='email'
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.email}
                                isValid={formik.isValid}
                                isTouched={formik.touched.email}
                                invalidFeedback={
                                    formik.errors.email
                                }
                                disabled={!isAdd}
                            />
                        </FormGroup>
                    </div>
                    <div className='col-12 col-md-6'>
                        <FormGroup
                            id='role'
                            label='Role'
                            isFloating>
                            <Input
                                placeholder='Role'
                                value={formik.values.role}
                                disabled
                            />
                        </FormGroup>
                    </div>
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
                            onClick={formik.handleSubmit}>
                            {waitingForAxios ? <Spinner size='sm' /> : 'Save'}
                        </Button>
                    </CardFooterRight>
                </CardFooter>
            }

        </Card>

    );
};

export default UserFields;
