import React from 'react'
import Card, { CardBody } from '../../../bootstrap/Card'
import CustomBadgeWithIcon from '../../../CustomComponent/BadgeWithIcon'
import Icon from '../../../icon/Icon'

const ServiceRequestsCard = ({data}: {data: any}) => {

    const Column = (label: string, value: any, col = 4) => (
        <div className="mb-2">
        <div className="text-muted small mb-1">{label}</div>
        <div className="fw-semibold text-dark">{value}</div>
    </div>
    );
  return (
    <Card >
    <CardBody>
        <div className="row align-items-start">
            {/* Left Column - Job Identification */}
            <div className="col-md-4">
                <div className="mb-2">
                    {Column('SR No:', data.sr_no)}
                    {Column('Entity Name:', data.entity_name)}
                </div>
            </div>

            {/* Middle Column - Job Details */}
            <div className="col-md-4">
                {Column('No Of Traps:', data.no_of_traps)}
                {Column('Assigned Vehicle:', data.assigned_vehicle)}
                {Column('Total Grease Collected:', data.total_grease_collected.toFixed(2))}
            </div>

            {/* Right Column - Time and Status */}
            <div className="col-md-4 position-relative">
                <div className="position-absolute top-0 end-0">
                   <Icon icon='Info' color='primary' size='2x' />
                </div>

                {Column('Collected Time:', data.collected_time)}
                {Column('Discharged Time:', data.discharged_time)}
                {Column('Status:', <CustomBadgeWithIcon>{data.status}</CustomBadgeWithIcon>)}
            </div>
        </div>
    </CardBody>
</Card>
  )
}

export default ServiceRequestsCard