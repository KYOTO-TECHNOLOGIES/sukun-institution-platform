import React from 'react'
import PageWrapper from '../../layout/PageWrapper/PageWrapper'
import Card, { CardBody } from '../../components/bootstrap/Card'

const TermsAndCondition=()=> {

  return (
    <PageWrapper title='Terms of use' className='p-4'>
        <Card className='mt-4'>
            <CardBody>
            <h3 className='text-center mb-3'><u>Terms And Condition</u></h3>
           
            </CardBody>
        </Card>
    </PageWrapper>
  )
}

export default TermsAndCondition
