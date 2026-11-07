import React, { useState } from 'react';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Card, { CardBody, CardHeader, CardLabel, CardSubTitle, CardTitle } from '../../components/bootstrap/Card';
import Page from '../../layout/Page/Page';
import Button from '../../components/bootstrap/Button';
import MyProfile from './MyProfile'
import ChangePassword from './ChangePassword'
import ProfilePicUpload from '../../components/CustomComponent/ProfilePicUpload';


const Index = () => {

    const [activeTab, setActiveTab] = useState<any>("My Profile");
    const [image, setImage] = useState(null);
    const tabsData = [
        { name: 'My Profile', icon: 'Contacts' },
        { name: 'Change Password', icon: 'Lock' },
    ];
    const tabComponents: any = {
        'My Profile': <MyProfile />,
        'Change Password': <ChangePassword />,
    };

    return (
        <PageWrapper title='Profile'>
            <Page container='fluid'>
                <div className='row h-100'>
                    <div className='col-xxl-3 col-xl-4 col-lg-6'>
                        <Card stretch >
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
                            <CardBody className='d-flex flex-column align-items-center p-4 mt-3'>
                                <div className='mb-5'>
                                    <ProfilePicUpload setImage={setImage} image={image} isProfile />
                                </div>
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

                        </Card>
                    </div>
                    <div className='col-xxl-9 col-xl-8 col-lg-6' style={{ height: "82vh" }}>
                        {tabComponents[activeTab]}
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};

export default Index;