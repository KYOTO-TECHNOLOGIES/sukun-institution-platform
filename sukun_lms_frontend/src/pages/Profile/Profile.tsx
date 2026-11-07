import React, {  useEffect, useState } from 'react';
import {useSelector,useDispatch} from 'react-redux'
import { useParams } from 'react-router-dom';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import SubHeader, { SubHeaderLeft, SubheaderSeparator } from '../../layout/SubHeader/SubHeader';
import Card, { CardBody, CardFooter, CardFooterLeft, CardHeader, CardLabel, CardSubTitle, CardTitle } from '../../components/bootstrap/Card';
import Page from '../../layout/Page/Page';
import Button from '../../components/bootstrap/Button';
import BackButton from '../../components/CustomComponent/Buttons/BackButton';
import Avatar from '../../components/Avatar';
import UserDetails from '../../components/PageComponents/UserManagement/Details/UserDetails'
//@ts-ignore
import ProfilePic from "../../assets/img/Avatar.svg"
import { setUserDetails } from '../../store/user';
import DeleteButtonWithNavigation from '../../components/CustomComponent/Buttons/DeleteButtonWithNavigation'


const Index = () => {

    const {id}=useParams();
    const dispatch=useDispatch();
    const [activeTab, setActiveTab] = useState<any>("User Details");
    const tabsData = [
    { name: 'User Details', icon: 'Contacts' },
    // { name: 'Address', icon: 'Place' },
    ];
    const tabComponents: any = {
        'User Details': <UserDetails />,
    };
    const UserData=useSelector((state:any)=>state.UserSlice.user_details)


   

     useEffect(()=>{
        // console.log(UserData)
      return()=>{
      dispatch(setUserDetails(null))

      }
    },[])

    return (
        <PageWrapper title='Profile'>
            <SubHeader>
                <SubHeaderLeft>
                    <BackButton />
                     <SubheaderSeparator />
                     <Avatar srcSet='' src={UserData?.src||ProfilePic} size={32} />                
                     <span>   
                         <strong>{`${UserData?.first_name||''} ${UserData?.last_name||''}` }</strong>                    
                         </span>
                         <span className='text-muted'>Edit User</span>
                </SubHeaderLeft>
            </SubHeader>
            <Page container='fluid'>
                <div className='row h-100'>
                    <div className='col-xxl-3 col-xl-4 col-lg-6'>
                        <Card stretch borderSize={2}>
                            <CardHeader>
                                 <CardLabel icon='Person' iconColor='primary'>
                                    <CardTitle tag='div' className='h5'>
                                        Profile Settings
                                     </CardTitle>
                                     <CardSubTitle tag='div' className='h6'>
                                       Personal Information
                                   </CardSubTitle>
                                 </CardLabel>
                             </CardHeader>
                            <CardBody >
                                <div className='row g-3' >
                                    {tabsData.map((tab) => (
                                        <div key={`${Date.now()}-${Math.random() * 1000}`} className='col-12'>
                                            <Button
                                                color="primary"
                                                className='w-100 p-3 '
                                                isLight={tab.name !== activeTab}
                                                icon={tab.icon}
                                                onClick={() => setActiveTab(tab.name)}>
                                                {tab.name}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                             <CardFooter>
                               <CardFooterLeft className='w-100'>
                                  <DeleteButtonWithNavigation apiEndpoint=''route='' width='100%' height='45px' text='Delete User'/>
                               </CardFooterLeft>
                           </CardFooter>
                        </Card>
                    </div>
                    <div className='col-xxl-9 col-xl-8 col-lg-6' style={{height:"82vh"}}>
                        {tabComponents[activeTab]}
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default Index;