import { academicResources } from './academicResources';
import { operationsResources } from './operationsResources';
import { financeResources } from './financeResources';
import { learningResources } from './learningResources';
import { Resource, field, select, relation } from './resourceTypes';
export type {Resource, Field, ResourceAction} from './resourceTypes';
export const resources: Record<string, Resource> = {
    ...learningResources,
    ...academicResources,
    ...operationsResources,
    ...financeResources,
    campaigns: {title:'Marketing campaigns', subtitle:'Plan outreach, track spend, and understand where your enquiries come from.', endpoint:'/api/admissions/campaigns/', permission:'admissions', icon:'Campaign', institution:true,
        fields:[field('name','Campaign name','text',true), select('channel','Channel',['SOCIAL','SEARCH','REFERRAL','EVENT','PRINT','OTHER']), select('status','Status',['DRAFT','ACTIVE','PAUSED','COMPLETED']),
            {...field('budget','Budget','number'),min:0,step:'0.01'}, {...field('spent','Spend to date','number'),min:0,step:'0.01'},
            field('start_date','Start date','date',true), field('end_date','End date','date'), field('notes','Campaign notes','textarea')],
        columns:['name','channel','status','budget','spent','start_date']},
    enquiries: {title:'Enquiries & admissions pipeline', subtitle:'Give every prospective family a clear next step.',endpoint:'/api/admissions/leads/', permission:'admissions',icon:'People',institution:true,
        fields:[field('full_name','Student / prospect name','text',true),field('phone','Contact phone','tel',true),field('email','Email','email'),field('guardian_name','Guardian name'),
            field('source','Enquiry source'), relation('campaign','Campaign','/api/admissions/campaigns/','name'),
            relation('interested_class','Interested class','/api/academics/classes/','name'),
            select('stage','Stage',['NEW','CONTACTED','QUALIFIED','VISIT_SCHEDULED','APPLICATION','LOST']),field('next_follow_up','Next follow-up','datetime-local'),
            field('notes','Conversation notes','textarea'),field('lost_reason','Reason if lost')],
        columns:['full_name','phone','source','stage','next_follow_up']},
    'follow-ups': {title:'Follow-up desk',subtitle:'Keep promises to families and close the loop after every conversation.', endpoint:'/api/admissions/follow-ups/',permission:'admissions',icon:'EventAvailable',
        fields:[relation('lead','Enquiry','/api/admissions/leads/','full_name',true), field('due_at','Due at','datetime-local',true),select('channel','Contact method',['CALL','EMAIL','VISIT','MESSAGE']),field('notes','Follow-up plan / outcome','textarea',true)],
        columns:['lead_name','channel','due_at','completed_at','notes'],actions:[{label:'Mark complete',endpoint:'complete/',visible:row=>!row.completed_at}]},
    applications: {title:'Admission applications',subtitle:'Review documents, approve places, and enroll students with their own login.',endpoint:'/api/admissions/applications/',permission:'admissions',icon:'HowToReg',institution:true,noDelete:true,
        fields:[field('first_name','First name','text',true),field('last_name','Last name'),field('phone','Unique student login phone','tel',true),field('email','Student email','email'),
            field('date_of_birth','Date of birth','date'),select('gender','Gender',['MALE','FEMALE']),field('guardian_name','Guardian name'),field('guardian_phone','Guardian login phone','tel'),
            field('address','Address','textarea'),relation('lead','Source enquiry','/api/admissions/leads/','full_name'),
            relation('division','Class division','/api/academics/divisions/','name',true),relation('academic_year','Academic year','/api/institutions/academic-years/','name',true),
            field('documents_verified','Documents verified','checkbox'),field('notes','Admission notes','textarea')],
        columns:['first_name','last_name','phone','division_name','status','documents_verified'],
        actions:[
            {label:'Review',endpoint:'review/',fields:[select('status','Decision',['UNDER_REVIEW','APPROVED','REJECTED']),field('reason','Reason / feedback','textarea')],visible:(row,role)=>row.status!=='ENROLLED'&&role!=='MARKETING'},
            {label:'Enroll student',endpoint:'enroll/',fields:[{...field('initial_password','Initial student password','password',true),help:'At least 8 characters. Share securely with the student.'}, {...field('guardian_password','Optional guardian password','password'),help:'Creates a separate parent login when a guardian phone is provided.'}],visible:(row,role)=>row.status==='APPROVED'&&role!=='MARKETING'}
        ]}
};
