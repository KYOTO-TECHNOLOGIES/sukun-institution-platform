import React from 'react'
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../components/bootstrap/Card'
import ChangePassword from '../../components/PageComponents/UserManagement/Details/ChangePassword'

const ChangePasswordComponent = () => {
  return (
    <Card stretch borderSize={2}>
      <CardHeader>
        <CardLabel icon='Lock' iconColor='primary'>
          <CardTitle tag='div' className='h5'>
            Change Password
          </CardTitle>
        </CardLabel>
      </CardHeader>
      <CardBody isScrollable>
        <ChangePassword isFormProfile changePasswordApi='/api/users/profile/' />
      </CardBody>

    </Card>
  )
}

export default ChangePasswordComponent
