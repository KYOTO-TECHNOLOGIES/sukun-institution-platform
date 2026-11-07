import React from 'react'
import { Row, Col } from 'reactstrap'
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../../../components/bootstrap/Card'

const EstablishmentRequestDetailsSkeleton = () => {
  return (
    <>
      <div className='d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3'>
        <div className='skeleton-loader' style={{ width: '320px', height: '32px', borderRadius: '12px' }} />
        <div className='d-flex gap-2'>
          <div className='skeleton-loader' style={{ width: '100px', height: '40px', borderRadius: '999px' }} />
          <div className='skeleton-loader' style={{ width: '110px', height: '40px', borderRadius: '999px' }} />
        </div>
      </div>

      <Row className='g-4'>
        <Col lg={12}>
          <Card className='h-100 border-0 shadow-sm rounded-4'>
            <CardHeader className='border-0 bg-white pb-0'>
              <CardLabel icon='Business' iconColor='success'>
                <CardTitle tag='div' className='h5 mb-0'>
                  <div className='skeleton-loader' style={{ width: '220px', height: '24px', borderRadius: '8px' }} />
                </CardTitle>
              </CardLabel>
            </CardHeader>
            <CardBody className='p-4'>
              <Row className='g-4 mb-4'>
                <Col xs={12} lg={5}>
                  <div
                    className='h-100 p-4 rounded-4'
                    style={{ backgroundColor: '#f7f9fc', border: '1px solid #edf1f7' }}
                  >
                    <div className='skeleton-loader mb-4' style={{ width: '160px', height: '16px', borderRadius: '6px' }} />
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className='mb-3'>
                        <div className='skeleton-loader mb-2' style={{ width: '140px', height: '14px', borderRadius: '6px' }} />
                        <div className='skeleton-loader' style={{ width: '100%', height: '20px', borderRadius: '8px' }} />
                      </div>
                    ))}
                  </div>
                </Col>
                <Col xs={12} lg={7}>
                  <div
                    className='h-100 p-4 rounded-4'
                    style={{ backgroundColor: '#ffffff', border: '1px solid #edf1f7' }}
                  >
                    <div className='skeleton-loader mb-4' style={{ width: '200px', height: '16px', borderRadius: '6px' }} />
                    <Row className='g-3'>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Col xs={12} sm={6} key={index}>
                          <div className='mb-3'>
                            <div className='skeleton-loader mb-2' style={{ width: '120px', height: '14px', borderRadius: '6px' }} />
                            <div className='skeleton-loader' style={{ width: '100%', height: '20px', borderRadius: '8px' }} />
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default EstablishmentRequestDetailsSkeleton

