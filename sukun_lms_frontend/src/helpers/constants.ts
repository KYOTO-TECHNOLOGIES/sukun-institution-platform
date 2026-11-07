import type { TColor } from '../type/color-type';

export const userTypes:any ={'Superuser':'Superuser','Admin':'Admin','User':'User','Inspector':'Inspector','Assistant User':'Assistant User'}
export const AxiosTimeout = 20000;

export const NoData = '----';
export const pageSizeOptions = [5, 10, 20, 50];
export const debounceIntervalForTable = 1000;

export const DeleteMessage = 'Are you certain you want to proceed with this action?';

export const partyTypeOptions = {
  'Region': 'MyLocation',
  'GTCC': 'Shield',
  'Establishment': 'LocationCity',
  'Authority': 'Group',
  'Apartment': 'Apartment'
}


export const badgeColorOptions =  {
  'Activated':'success',
  'Active':'success',
  'Completed':'success',
  'Deleted':'danger',
  'Deactivated':'warning',
  'Disabled':"warning",
  'Invited':'info',
  'Processing':'warning',
  'Overdue':'danger',
  'Due':'warning',
  'Cleaned':'success',
  'Inspected' : 'success',
  'Approval Pending' : 'warning',
  'Converted':'success',
  'Synced':'info' ,
  'Pending':'warning',
  'Approved':'success',
  'Canceled':'danger',
  'Entered' : 'success',
  'Exited' : 'danger',
  'Accepted' :'success',
  'Success':'success',
  'Failed':'danger',
  'Expired':'danger',
  "Initiated":'info',
  'Rejected' : 'danger',
  'Reported' : 'info',
  'Hold' : 'warning',
  'Verbal Warning' :  'warning',
  'Email Warning' :  'warning',
  'Written Warning' :  'warning',
  'Referred DM' :  'danger',
  'Fine' : 'danger',
  'Partially Collected' : 'warning',
  // 'Failed' : 'danger',
  'Sent' : 'success',
  'SUCCESS' : 'success',
  'FAILURE' : 'danger',
  'PENDING' : 'warning',
  'STARTED' : 'info'
}

export const customStyles = {
    menu: (base:any) => ({
      ...base,
      
      maxHeight: "150px", // your desired height
   
    }),
    menuPortal:(base:any) => ({
      ...base,
      
     zIndex:9999, // your desired height
   
    }),
    control: (provided:any, state:any) => ({
      ...provided,
      height: 28,
      // borderRadius: "15px",
      backgroundColor:"#F8F9FA" ,
      borderColor:"#EBECED",
      fontWeight: 600, 
      fontSize: "13px",
    }),
    option: (provided:any, state:any) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#EFF2F7" : null,
      color: state.isFocused ? "black" : "inherit",
      // backgroundColor: state.isSelected ? "#EFF2F7" : null,
      // color: state.isSelected ? "your_selected_text_color" : "inherit",
      ":active": {
        backgroundColor: "#EFF2F7",
        // color: "your_selected_text_color",
      },
    }),
    menuList: (base:any) => ({
      ...base,
      maxHeight: "150px", // your desired height
     
    }),
  };

  export const customStylesForVisitorCount = {
    menu: (base:any) => ({
      ...base,
      
      maxHeight: "150px", // your desired height
   
    }),
    menuPortal:(base:any) => ({
      ...base,
      
     zIndex:9999, // your desired height
   
    }),
    control: (provided:any, state:any) => ({
      ...provided,
      height: 25,
      borderRadius: "15px",
      backgroundColor:"#F8F9FA" ,
      borderColor:"#EBECED",
      fontWeight: 600, 
      fontSize: "13px",
    }),
    option: (provided:any, state:any) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#EFF2F7" : null,
      color: state.isFocused ? "black" : "inherit",
      // backgroundColor: state.isSelected ? "#EFF2F7" : null,
      // color: state.isSelected ? "your_selected_text_color" : "inherit",
      ":active": {
        backgroundColor: "#EFF2F7",
        // color: "your_selected_text_color",
      },
    }),
    menuList: (base:any) => ({
      ...base,
      maxHeight: "150px", // your desired height
     
    }),
  };
  export const customStyleForMultiSelectDarkMode = {
    menu: (base:any) => ({
      ...base,
      maxHeight: "140px", // your desired height
    }),
    control: (provided:any, state:any) => ({
      ...provided,
      minHeight: 28,
      borderRadius: "15px",
      backgroundColor:"#212529" ,
      borderColor:"#343A40",
      fontWeight: 600, 
      fontSize: "13px",
      color:'white',
    }),
    option: (provided:any, state:any) => ({
      ...provided,
      borderRadius:"10px",    
      backgroundColor: state.isFocused ? "#505359" : null,      
      color: 'white ' ,
      ":active": {
        backgroundColor: "#505359",
      },
     
    }),
    menuList: (base:any) => ({
      ...base,
      maxHeight: "140px", // your desired height
      backgroundColor: "black",
      paddingLeft:"5px",
      paddingRight:"5px",
      color:"white"
    }),
    multiValue: (provided:any) => ({
      ...provided,
      color:'white',
      backgroundColor:'#2E2E2E',
      borderRadius:"10px" 
  }),
    multiValueLabel: (provided:any) => ({
      ...provided,
      color:'white',
  }),

  };

  export const tableStyleOverrideConstant =  {
              MuiCheckbox: {
                colorSecondary: {
                color: "grey",
                "&$checked": {
                  color: "grey"
                },
                // "&$hover":{
                //   color: "black"
                // }
                
                },
              },
              MuiPaper:{
                root:{
                  fontFamily:'inherit'

                }
              },
              MuiPopover:{
                paper:{
                  borderRadius:'10px',
                }
              },
              MuiMenuItem:{
                root:{
                  fontFamily:'inherit'
                }
              }
              
              }

  export const selectCustomStyle = {
    menu: (base:any) => ({
      ...base,
  
      maxHeight: "140px", // your desired height
    }),
    control: (provided:any, state:any) => ({
      ...provided,
      height: 45,
      borderRadius: "15px",
      backgroundColor:"#F8F9FA" ,
      borderColor:"#EBECED",
      fontWeight: 600, 
      fontSize: "13px",
    }),
    option: (provided:any, state:any) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#EFF2F7" : null,
      color: state.isFocused ? "black" : "inherit",
      // backgroundColor: state.isSelected ? "#EFF2F7" : null,
      // color: state.isSelected ? "your_selected_text_color" : "inherit",
      ":active": {
        backgroundColor: "#EFF2F7",
        // color: "your_selected_text_color",
      },
    }),
    menuList: (base:any) => ({
      ...base,
      maxHeight: "140px", // your desired height
    }),
  };export const customStyleForMultiSelect = {
    menu: (base:any) => ({
      ...base,
  
      maxHeight: "140px", // your desired height
    }),
    control: (provided:any, state:any) => ({
      ...provided,
      minHeight: 28,
      borderRadius: "15px",
      backgroundColor:"#F8F9FA" ,
      borderColor:"#EBECED",
      fontWeight: 600, 
      fontSize: "13px",
    }),
    option: (provided:any, state:any) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#EFF2F7" : null,
      color: state.isFocused ? "black" : "inherit",
      ":active": {
        backgroundColor: "#EFF2F7",
        // color: "your_selected_text_color",
      },
    }),
    menuList: (base:any) => ({
      ...base,
      maxHeight: "140px", // your desired height
    }),
    multiValue: (provided:any) => ({
      ...provided,
      color:'gray',
      backgroundColor:'#dcdcdc ',
      borderRadius:"10px" 
  }),
   
  };

  export const customStylesMultiselect = {
    menu: (base:any) => ({
      ...base,
  
      maxHeight: "140px", // your desired height
    }),
    control: (provided:any, state:any) => ({
      ...provided,
      minHeight: 28,
      borderRadius: "15px",
      backgroundColor:"#F8F9FA" ,
      borderColor:"#EBECED",
      fontWeight: 600, 
      fontSize: "13px",
    }),
    option: (provided:any, state:any) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#EFF2F7" : null,
      color: state.isFocused ? "black" : "inherit",
      // backgroundColor: state.isSelected ? "#EFF2F7" : null,
      // color: state.isSelected ? "your_selected_text_color" : "inherit",
      ":active": {
        backgroundColor: "#EFF2F7",
        // color: "your_selected_text_color",
      },
    }),
    menuList: (base:any) => ({
      ...base,
      maxHeight: "140px", // your desired height
    }),
  };

  export const YesOrNoOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];
  export const YesOrNoFieldOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];

  export const buttonColor=["#d33","#46BCAA","#0082C2","#4D69FA"]

	/**
	 * Maps workflow stage keys to bootstrap `text-*` / `Icon` colors for the shared TimeLine component.
	 * Add keys for your API statuses; unknown keys fall back via `getTimeLineColor`.
	 */
	export const TimeLineColor: Record<string, TColor> = {
		HostApproval: 'primary',
		CyberSecurity: 'info',
		Security: 'warning',
		Clearance: 'success',
		PhysicalVerification: 'secondary',
		/** Serving history row: still at counter */
		serving_active: 'info',
		/** Serving history row: visit ended */
		serving_completed: 'success',
		/** Serving history row from a parent token in aggregated history */
		serving_parent: 'warning',
	};

	export const getTimeLineColor = (status?: string | null): TColor => {
		if (!status) return 'secondary';
		return TimeLineColor[status] ?? 'secondary';
	};



  export const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
  export const daysOfWeekText =['Sun','Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];



  
	export const FieldOptions = [
		{ value: 'Text', label: 'Text' },
		{ value: 'Large Text', label: 'Large Text' },
		{ value: 'Number', label: 'Number' },
		{ value: 'Email', label: 'Email' },
		{ value: 'Document', label: 'Document' },
		{ value: 'Photo', label: 'Photo' },
		{ value: 'Single Option', label: 'Single Option' },
		{ value: 'Multiple Options', label: 'Multiple Options' },
		{ value: 'Yes or no question', label: 'Yes or no question' },
		{ value: 'Date', label: 'Date' },
		{ value: 'URL', label: 'URL' },
		{ value: 'Phone', label: 'Phone' },
	];

  export const navItems = [
    { title: 'Tower', key: 'towers' },
    { title: 'Company', key: 'company' },
    // { title: 'Group', key: 'Group' },
    { title: 'Event', key: 'Event' },
    { title: 'Visitor', key: 'Visitor' },
    { title: 'Account', key: 'Account' },

  ];

  export const DataFiledOptions = {
    towers: 'towers',
    Group: 'groups',
    company: 'company',
    Event: 'events',
    Visitor: 'visitor',
    Account: 'account',
  };





  export const TriggerOptions = [
		{ value: 'Scheduled', label: 'Scheduled' },
		{ value: 'Requested', label: 'Requested' },
		{ value: 'Exited', label: 'Exited' },
		{ value: 'Approved', label: 'Approved' },
		{ value: 'Rejected', label: 'Rejected' },
	];
  	// { value: 'Signing In', label: 'Signing In' },
		// { value: 'Signing Out', label: 'Signing Out' },
		// { value: 'Pre-registered', label: 'Pre-registered' },
		// { value: 'Rejected Signing In', label: 'Rejected Signing In' },
    // { value: 'Delayed', label: 'Delayed' },
    // { value: 'Issued', label: 'Issued ' },
    // { value: 'No Show', label: 'No Show' },


  export const MessageChannelOptions = [
		{ value: 'Email', label: 'Email' },
		{ value: 'Sms', label: 'Sms' },
		
		
	];

  export const EntryTypes = [
		{ value: 'Entry', label: 'Entry' },
		{ value: 'Exit', label: 'Exit' },
    { value: 'No-Action', label: 'No-Action' },

		
		
	];


  export 	const errorMessage = {
		Tenant: '*Messages have already been assigned to groups, or please enable group visibility.',
		Site: '*Messages have already been assigned to groups, or please enable group visibility.',
	};

  export const BufferTimeOptions=[
                                  {label: "15 Minutes", value:900},
                                  {label: "30 Minutes", value: 1800},
                                  {label: "1 Hour", value: 3600},
                                  {label: "2 Hour", value:7200},
                                ] 



   

// export const userNamesBasedOnUserTypes = {
//   zaair_admin	:'Admin',
//   zaair_assistant: ''
// }

export const namesBasedOnUserTypes:any={
	'zaair_admin':'Admin',
	'tenant_admin':'Company Admin',
	'abaci_admin':'Admin',
	'zaair_assistant':'Assistant',
	'zaair_receptionist':'Receptionist',
  "tenant_employee" : 'Company Employee',
	'tenant_user':'Company User'
}

export const getDefaultFields = () => [
  {
    id: 1,
    description: 'First name',
    type_of_field: 'Text',
    is_required: true,
    order: 0,
    options: [],
  },
  {
    id: 2,
    description: 'Last name',
    type_of_field: 'Text',
    is_required: false,
    order: 0,
    options: [],
  },
  
  {
    id: 4,
    description: 'Email',
    type_of_field: 'Email',
    is_required: true,
    order: 0,
    options: [],
  },
  {
    id: 5,
    description: 'Contact No',
    type_of_field: 'Phone',
    is_required: true,
    order: 0,
    options: [],
  },
];


export const customStylesDark = {
  menu: (base:any) => ({
    ...base,
    
    maxHeight: "150px", // your desired height
 
  }),
  menuPortal:(base:any) => ({
    ...base,
    
   zIndex:9999, // your desired height
 
  }),
  control: (provided:any, state:any) => ({
    ...provided,
    height: 28,
    borderRadius: "15px",
    backgroundColor:"#212529" ,
    borderColor:"#343A40",
    fontWeight: 600, 
    fontSize: "13px",
    color:'red',
    
   
 
    
    
  }

),

  option: (provided:any, state:any) => ({
    ...provided,
    borderRadius:"10px",
    
    backgroundColor: state.isFocused ? "#505359" : null,
    
    color: 'white ' ,
    // backgroundColor: state.isSelected ? "#EFF2F7" : null,
    // color: state.isSelected ? "your_selected_text_color" : "inherit",
    ":active": {
      backgroundColor: "#505359",
      // color: "your_selected_text_color",
    },
    
  }),
  singleValue: (provided:any) => ({
    ...provided,
    color: 'white', // Ensure selected value text is red
}),
  menuList: (base:any) => ({
    ...base,
    maxHeight: "150px", // your desired height
    backgroundColor: "black",
    paddingLeft:"5px",
    paddingRight:"5px",
    color:"white"


   
  }),
};



export const SeverityColorCodes:any = {
  Low:'#46BCAA',
  Medium:'#FFD600',
  High:'#d33',

};

export const statusColorCodes:any = {
  Active:'#46BCAA',
  Inactive:'#F35421',
  Invited:'#0082C2',
  Disabled:'#F35421',
  Assigned:'#46BCAA',
  Unassigned:'#F35421',
  'Yet to start':"#FFD600",
  Deleted:'#d33',


};


export const csvLimit = 100000;
export const pdfLimit = 5000;
export const statusForFrontend= { Activated: 'Active', Deactivated: 'Inactive', Invited: 'Invited' };

export const validationlist = [
  'Please make sure to fill in all the required fields.',
  'Date field: Input a date in the format YYYY-MM-DD.',
  'Time field: Input a time in 24 hour format  hh:mm:ss.',
  'Numeric field: Provide a numeric value.',
  'Email field: Enter a valid email address.',
  'Single Select: Enter an option from the dropdown list.',
  'Multi Select: Enter options with comma separator from the dropdown list.',
  'File fields are not supported.',
];

export const GenderOptions=[{label:'Male',value:'Male'},{label:'Female',value:'Female'}]
export const UserTypeOptions=[{label:'Super Admin',value:'Super Admin'},{label:'Admin',value:'Admin'}]


export const userDummyData = [
  {
    id: 1,
    employee_id: 'EMP1',
    email: 'alice1@gmail.com',
    full_name: 'Alice Smith',
    first_name: 'Alice ',
    last_name: 'Smith',
    designation: 'Manager',
    contact_number: '1234567890',
    extension_no:'ED100',
    color: 'primary',
    src: 'https://i.pravatar.cc/100?img=1',
    isOnline: true,
    services: [
      { name: 'Consulting', icon: 'Apartment', color: 'primary' },
      { name: 'Design', icon: 'DesignServices', color: 'info' }
    ]
  },
  {
    id: 2,
    employee_id: 'EMP2',
    email: 'bob2@gmail.com',
    full_name: 'Bob Johnson',
    first_name: 'Bob ',
    last_name: 'Johnson',
        extension_no:'ED100',

    designation: 'Developer',
    contact_number: '1234567891',
    color: 'success',
    src: 'https://i.pravatar.cc/100?img=2',
    isOnline: false,
    services: [
      { name: 'Development', icon: 'Code', color: 'success' }
    ]
  },
  {
    id: 3,
    employee_id: 'EMP3',
    email: 'charlie3@gmail.com',
    full_name: 'Charlie',
    first_name: 'Charlie ',
    last_name: '',
    designation: 'Designer',
    contact_number: '1234567892',
        extension_no:'ED100',

    color: 'danger',
    src: 'https://i.pravatar.cc/100?img=3',
    isOnline: true,
    services: [
      { name: 'Design', icon: 'DesignServices', color: 'info' }
    ]
  },
  {
    id: 4,
    employee_id: 'EMP4',
    email: 'diana4@gmail.com',
    full_name: 'Diana Williams',
    first_name: 'Diana ',
    last_name: 'Williams',
        extension_no:'ED100',

    designation: 'Analyst',
    contact_number: '1234567893',
    color: 'warning',
    src: 'https://i.pravatar.cc/100?img=4',
    isOnline: false,
    services: [
      { name: 'Consulting', icon: 'Apartment', color: 'primary' }
    ]
  },
  {
    id: 5,
    employee_id: 'EMP5',
    email: 'edward5@gmail.com',
    full_name: 'Edward',
    first_name: 'Edward ',
        extension_no:'ED100',

    last_name: '',
    designation: 'Support',
    contact_number: '1234567894',
    color: 'info',
    src: 'https://i.pravatar.cc/100?img=5',
    isOnline: true,
    services: [
      { name: 'Support', icon: 'Headphones', color: 'info' },
      { name: 'Consulting', icon: 'Apartment', color: 'primary' }
    ]
  },
  {
    id: 6,
    employee_id: 'EMP6',
    email: 'fiona6@gmail.com',
    full_name: 'Fiona Clark',
    first_name: 'Fiona ',
    last_name: 'Clark',
    designation: 'HR',
    contact_number: '1234567895',
    color: 'secondary',
    src: 'https://i.pravatar.cc/100?img=6',
    isOnline: false,
    services: [
      { name: 'Recruitment', icon: 'People', color: 'secondary' }
    ]
  },
  {
    id: 7,
    employee_id: 'EMP7',
    email: 'george7@gmail.com',
    full_name: 'George King',
    first_name: 'George ',
    last_name: 'King',
    designation: 'Developer',
    contact_number: '1234567896',
    color: 'success',
    src: 'https://i.pravatar.cc/100?img=7',
    isOnline: true,
    services: [
      { name: 'Development', icon: 'Code', color: 'success' }
    ]
  },
  {
    id: 8,
    employee_id: 'EMP8',
    email: 'hannah8@gmail.com',
    full_name: 'Hannah Ray',
    first_name: 'Hannah ',
    last_name: 'Ray',
    designation: 'Marketing',
    contact_number: '1234567897',
    color: 'warning',
    src: 'https://i.pravatar.cc/100?img=8',
    isOnline: true,
    services: [
      { name: 'Promotion', icon: 'Campaign', color: 'warning' }
    ]
  },
  {
    id: 9,
    employee_id: 'EMP9',
    email: 'ian9@gmail.com',
    full_name: 'Ian Wright',
    first_name: 'Ian ',
    last_name: 'Wright',
    designation: 'Finance',
    contact_number: '1234567898',
    color: 'info',
    src: 'https://i.pravatar.cc/100?img=9',
    isOnline: false,
    services: [
      { name: 'Budgeting', icon: 'AttachMoney', color: 'info' }
    ]
  },
  {
    id: 10,
    employee_id: 'EMP10',
    email: 'julia10@gmail.com',
    full_name: 'Julia Brown',
    first_name: 'Julia ',
    last_name: 'Brown',
    designation: 'Support',
    contact_number: '1234567899',
    color: 'primary',
    src: 'https://i.pravatar.cc/100?img=10',
    isOnline: true,
    services: [
      { name: 'Support', icon: 'Headphones', color: 'primary' }
    ]
  },
  {
    id: 11,
    employee_id: 'EMP11',
    email: 'kevin11@gmail.com',
    full_name: 'Kevin Lee',
    first_name: 'Kevin ',
    last_name: 'Lee',
    designation: 'Designer',
    contact_number: '1234567800',
    color: 'danger',
    src: 'https://i.pravatar.cc/100?img=11',
    isOnline: false,
    services: [
      { name: 'Design', icon: 'DesignServices', color: 'danger' }
    ]
  },
  {
    id: 12,
    employee_id: 'EMP12',
    email: 'laura12@gmail.com',
    full_name: 'Laura Kim',
    first_name: 'Laura ',
    last_name: 'Kim',
    designation: 'Manager',
    contact_number: '1234567801',
    color: 'primary',
    src: 'https://i.pravatar.cc/100?img=12',
    isOnline: true,
    services: [
      { name: 'Consulting', icon: 'Apartment', color: 'primary' }
    ]
  },
  {
    id: 13,
    employee_id: 'EMP13',
    email: 'michael13@gmail.com',
    full_name: 'Michael Chen',
    first_name: 'Michael ',
    last_name: 'Chen',
    designation: 'Developer',
    contact_number: '1234567802',
    color: 'success',
    src: 'https://i.pravatar.cc/100?img=13',
    isOnline: false,
    services: [
      { name: 'Development', icon: 'Code', color: 'success' }
    ]
  },
  {
    id: 14,
    employee_id: 'EMP14',
    email: 'nina14@gmail.com',
    full_name: 'Nina Patel',
    first_name: 'Nina ',
    last_name: 'Patel',
    designation: 'Designer',
    contact_number: '1234567803',
    color: 'info',
    src: 'https://i.pravatar.cc/100?img=14',
    isOnline: true,
    services: [
      { name: 'Design', icon: 'DesignServices', color: 'info' }
    ]
  },
  {
    id: 15,
    employee_id: 'EMP15',
    email: 'oscar15@gmail.com',
    full_name: 'Oscar Diaz',
    first_name: 'Oscar ',
    last_name: 'Diaz',
    designation: 'Analyst',
    contact_number: '1234567804',
    color: 'warning',
    src: 'https://i.pravatar.cc/100?img=15',
    isOnline: false,
    services: [
      { name: 'Research', icon: 'Analytics', color: 'warning' }
    ]
  }
];
