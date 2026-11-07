import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import Card, {
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
} from '../../components/bootstrap/Card';
import Icon from '../../components/icon/Icon';
import { authAxios } from '../../axiosInstance';
import useToasterNotification from '../../hooks/useToasterNotification';
import DashboardLoader from '../../components/CustomSpinner/CustomSpinner';
import Moments from '../../helpers/Moment';
import ButtonWithWarning from '../../components/CustomComponent/Buttons/ButtonWithWarning';
import Badge from '../../components/bootstrap/Badge';


const ActiveDevices = () => {
    const {showErrorNotification,showSuccessNotification}=useToasterNotification();
    const [isLoading,setIsLoading]=useState(true)
    const [deviceList,setDeviceList]=useState<any>([])

    useEffect(() => {
			const url = `api/users/activedevices`;
			authAxios
				.get(url)
				.then((res) => {
                    setIsLoading(false);
                    setDeviceList([{...res.data.current_device,is_current:true},...res.data.all_devices])
				})
				.catch((err) => {
					setIsLoading(false);
					showErrorNotification(err)
				});
		
	 // eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
    const onSuccessHandler = (response: any) => {
        setDeviceList((state:any)=>state.filter((device:any)=>device.id!==response.data.device))
        showSuccessNotification(response.data.message);
    }
        
	return (
	<Card stretch  className='shadow-3d-info prevent-userselect'>
            <CardHeader>
            <CardLabel icon='Devices' iconColor='success'>
                <CardTitle tag='div' className='h3'>
                   Active Devices
                </CardTitle>
            </CardLabel>
        </CardHeader>
	<CardBody isScrollable>
    {/* eslint-disable no-nested-ternary */}
    {isLoading ? (
        <DashboardLoader />
    ) : deviceList.length===0?
        <div className="position_centered">
            No active devices found!
        </div>
      : deviceList.map((device:any) => (
        <div className="col-12 prevent-userselect mb-3" >
      <div className="row">
        <div className="col d-flex align-items-center">
          <div className="flex-shrink-0">
            <div className="ratio ratio-1x1 me-3" style={{ width: 48 }}>
              <div
                className={classNames('rounded-2', 'd-flex align-items-center justify-content-center bg-l10-dark')}
              >
                <Icon icon='Devices'/>
              </div>
            </div>
          </div>
          <div className="flex-grow-1">
            <div className="fs-6" style={{width:"160px",textOverflow:"ellipsis",overflow:'hidden',whiteSpace:"nowrap"}}>{device?.browser||'----'} </div>
            <div className="text-muted">
            {device?.os||'----'}
            </div>
            <div className="text-muted " style={{fontSize:"10px"}}> 
            {Moments(device?.login_time,'datetime')||'----'}
            </div>
          </div>
        </div>
        <div className="col-auto text-end">
          <div className="mt-3">
            {!device?.is_current?
            <ButtonWithWarning
                  apiEndpoint={`api/users/blacklistactivedevice/${device?.id}`}
                  text="Do you want to logout the device ?"
                  confirmBtnText="Logout"
                  ButtonText=""
                  CancelButton ="No"
                  payload={{id:device?.id}}
                  OnSuccess={onSuccessHandler}
                  Icon="Logout"
                  Buttoncolor=""
                />:
                <Badge color='success'>Current</Badge>}
          </div>
        </div>
      </div>
        </div>
      ))

    }
    {/* eslint-enable no-nested-ternary */ }
	</CardBody>
	</Card>
	);
};

export default ActiveDevices;