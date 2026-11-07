import React, { FC, useContext, useEffect } from 'react'
import { Player } from '@lottiefiles/react-lottie-player';
import { useSelector,useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import OffCanvas, {
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../components/bootstrap/OffCanvas';
import Alert from '../../components/bootstrap/Alert';
import Button from '../../components/bootstrap/Button';
import useDarkMode from '../../hooks/useDarkMode';
import fileDownloader  from '../../helpers/FileDownloader';
import { addNotifications, deleteReportNotification } from '../../store/notifications';
import noNotification from "../../assets/Lottie/notification.json"
import Icon from '../../components/icon/Icon';
import { authAxios } from '../../axiosInstance';
import showNotification from '../../components/extras/showNotification';
import Error from '../../helpers/Error';
import AuthContext from '../../contexts/authContext';

const  Notifications: FC<any>=({isOpen,setIsOpen})=> {
  
  const { darkModeStatus } = useDarkMode();
  const { userData,setLogOut } = useContext(AuthContext)
  const dispatch=useDispatch()
	const NotificationsData = useSelector((state:any) => state.NotificationSlice?.notifications || []);
  const tempCount = useSelector((state:any) => state.NotificationSlice?.temp_count || 0);

  const deleteHandler = (id:string) => {
    const url = `api/zaair/app_notifications/${id}`
    authAxios.patch(url,{is_read:true})
    .then(() => dispatch(deleteReportNotification(id)))
    .catch(err => showNotification('Error',Error(err,setLogOut),'danger'))

  }
  


  function getFileType(filePath:string) {
    // Split the string by the dot ('.') character
    const parts = filePath.split('.');
    
    // Return the last element of the array
    return parts[parts.length - 1];
}

// function removeExportSuffix(inputString:string) {
//   const suffix = '_export';
  
//   // Check if the inputString ends with the suffix and remove it if present
//   if (inputString.endsWith(suffix)) {
//       return inputString.slice(0, -suffix.length);
//   }
  
//   // Return the original string if the suffix is not present
//   return inputString;
// }

function extractFilename(url:string) {
  // Split the URL by the '/' character
  const parts = url.split('/');
  // Get the last part of the array, which is the filename
  return parts[parts.length - 1];
}

const clearAllHandler = () =>{
  const url = `api/zaair/app_notifications_clear_all`
  authAxios.post(url)
  .then(() => dispatch(addNotifications([])))
  .catch(err => showNotification('Error',Error(err,setLogOut),'danger'))
}

   const ImportError:any={
    import_tenant_errors:{message:"An unexpected error occurred while importing the company list ! ",icon:"Apartment"},
    import_attendees_errors:{message:"An unexpected error occurred while importing the attendee list !",icon:"People"},
    import_user_errors:{message:"An unexpected error occurred while importing the users list !",icon:"Group"},
    import_watchlist_errors:{message:"An unexpected error occurred while importing the  watchlist !",icon:"Event"},
    "Tenant import":{message:"An unexpected error occurred while importing the company list !",icon:"Apartment"},
    import_visitor_access_card_errors:{message:"An unexpected error occurred while importing the visitor access card list !",icon:"Apartment"},

  }
    const Alerts:any={
    pdf:"PictureAsPdf",
    csv:"Description",
    fileUpload:'FileUpload',
    new_access_card_request:'CreditCard'
   }
  return (
    <OffCanvas
    id='notificationCanvas'
    titleId='offcanvasExampleLabel'
    placement='end'
    isOpen={isOpen}
    setOpen={setIsOpen}>
    <OffCanvasHeader setOpen={setIsOpen}>
      	{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <OffCanvasTitle id='offcanvasExampleLabel'>Notifications {NotificationsData?.length > 0 &&<u onClick={clearAllHandler} style={{cursor:'pointer',fontSize:'12px',marginLeft:'5px'}}>Clear All</u>}</OffCanvasTitle>
    </OffCanvasHeader>
    
    <OffCanvasBody>
        {NotificationsData?.length===0?
        
        <div >
					 <Player
              autoplay
              loop
              src={noNotification}
              style={{height:"250px"}}
              />
           <p className=' text-center font-weight-bold' 
            style={{
              position:"absolute",
              left:"30%",
              top:"30%"
            }}
           >Notifications not found !</p>

				 </div>
       : 
       NotificationsData.map((data:any,index:number)=>{
        if(data?.type === 'import_tenant'||data?.type === 'import_user'||data?.type === 'import_attendees'
        ||data?.report_type === 'import_tenant' || data?.report_type === 'import_attendees' || data?.report_type === 'import_user'){
          return(
            <Alert  isLight color="light"  key={uuidv4()}>
             

              <div className='d-flex gap-2'>
              <Icon icon={Alerts.fileUpload} size='2x'/>
              <p className='mt-2'>{data?.message?.message}</p>
            
              </div>

          <button
						type='button'
						className='btn-close'
            style={{position:'absolute',top:"6px",right:5}}
						aria-label='Close'
						onClick={() => deleteHandler(data.id)}
					/>
          {/* {data.message.error_descriptions.length > 0 &&
          <div className='text-danger' style={{marginLeft:'20px'}}>
        
            <b className='text-dark'>Errors:</b>
          <ul>
              <ErrorListComponent error_descriptions={data.message.error_descriptions} />
            </ul>
          </div>
        } */}
              </Alert>
          )
        }
        if(data?.report_type === 'new_access_card_request'){
          return(
            <Alert  isLight color="light"  key={uuidv4()}>
             

         <div className='d-flex gap-2'>
            <Icon icon={Alerts.new_access_card_request} size='2x'/>
            <p className='mt-2'>{data?.description}</p>
         </div>

         <button
          type='button'
          className='btn-close'
          style={{position:'absolute',top:"6px",right:5}}
          aria-label='Close'
          onClick={() => deleteHandler(data.id)}
        />
        </Alert>
          )
        }
        if(data?.report_type === 'import_visitor_access_card_errors' ||data?.report_type === 'import_tenant_errors' || data?.report_type === 'import_attendees_errors' || data?.report_type === 'import_user_errors'||data?.report_type === 'Tenant import'||data?.report_type === 'import_watchlist_errors'){
            return(
              <Alert  isLight color="light"  key={uuidv4()}>
                <div className='d-flex gap-1'>
                <Icon icon="Error" size='2x' color='danger'/>
                <p>{ImportError[data?.report_type].message} 
                  {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                  <a style={{color:"#4D69FA",cursor:"pointer"}} onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        fileDownloader(data?.link, 'bulk-import-errors');
                      }
                    }}
                   onClick={()=>fileDownloader(data?.link, 'bulk-import-errors')} ><u>Click to view </u>
                  </a>
                  </p> 
                </div>

               
              <button
              type='button'
              className='btn-close'
              style={{position:'absolute',top:"6px",right:5}}
              aria-label='Close'
              onClick={() => deleteHandler(data.id)}
            />
            {/* {data.message.error_descriptions.length > 0 &&
            <div className='text-danger' style={{marginLeft:'20px'}}>
          
              <b className='text-dark'>Errors:</b>
            <ul>
                <ErrorListComponent error_descriptions={data.message.error_descriptions} />
              </ul>
            </div>
          } */}
                </Alert>
            )
          }
        return(
        <Alert  isLight color="light" key={uuidv4()}>
         <div className='d-flex gap-1'>
          <Icon icon={Alerts[getFileType(data.link)]} size='2x' />
          <span  >
          {`Your ${extractFilename(data.link)} is ready to download!  `}
          <Button  
              icon='Download' 
              color={darkModeStatus ? 'dark' : 'light'}  
              isLight 
              onClick={()=>fileDownloader(data?.link, 'reports')}
            />
         </span>
        
        </div>
        <button
						type='button'
						className='btn-close'
            style={{position:'absolute',top:"3px",right:3}}
						aria-label='Close'
						onClick={() =>deleteHandler(data.id)}
					/>
        </Alert>
        )})}
    </OffCanvasBody>
</OffCanvas>
  )
}

export default Notifications