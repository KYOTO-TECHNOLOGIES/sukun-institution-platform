import { Resource, field, relation, select } from './resourceTypes';
const course = () => relation('course','Course','/api/learning/courses/','title',true);
export const learningResources: Record<string,Resource> = {
    courses:{title:'Course studio',subtitle:'Build a focused learning journey with lessons, assignments, and quizzes.',endpoint:'/api/learning/courses/',permission:'learning',icon:'MenuBook',institution:true,
        fields:[field('title','Course title','text',true),field('description','Course description','textarea'),relation('teacher','Course teacher','/api/accounts/teaching-staff/','full_name',true),relation('class_obj','Class','/api/academics/classes/','name'),select('status','Publication',['DRAFT','PUBLISHED','ARCHIVED'])],
        columns:['title','teacher_name','status','created_at']},
    lessons:{title:'Lessons & resources',subtitle:'Publish lesson notes, videos, and resource links in the right order.',endpoint:'/api/learning/lessons/',permission:'learning',icon:'PlayLesson',
        fields:[course(),field('title','Lesson title','text',true),{...field('position','Lesson order','number'),min:1,default:1},field('content','Lesson notes','textarea'),field('video_url','Video URL','url'),field('resource_url','Resource link','url'),{...field('duration_minutes','Duration (minutes)','number'),min:0,default:10},field('is_published','Published to learners','checkbox')],
        columns:['title','course_title','position','duration_minutes','is_published']},
    enrollments:{title:'Course enrollments',subtitle:'Give the right students access to each course.',endpoint:'/api/learning/enrollments/',permission:'learning',icon:'School',
        fields:[course(),relation('student','Student','/api/students/students/','full_name',true),select('status','Status',['ACTIVE','PAUSED','COMPLETED'])],columns:['student_name','course_title','status','created_at']},
    assignments:{title:'Assignments',subtitle:'Set clear expectations and deadlines for student work.',endpoint:'/api/learning/assignments/',permission:'learning',icon:'Assignment',
        fields:[course(),field('title','Assignment title','text',true),field('instructions','Instructions','textarea',true),field('due_at','Submission deadline','datetime-local',true),{...field('max_score','Maximum score','number',true),min:1,default:100},field('is_published','Published','checkbox')],
        columns:['title','course_title','due_at','max_score','is_published']},
    grading:{title:'Grading desk',subtitle:'Review submissions, record scores, and give useful feedback.',endpoint:'/api/learning/submissions/',permission:'learning',icon:'RateReview',noDelete:true,noCreate:true,
        fields:[{...field('score','Score','number'),min:0,step:'0.01'},field('feedback','Teacher feedback','textarea')],
        columns:['student_name','assignment_title','answer','attachment_url','is_late','score','max_score','feedback']},
    quizzes:{title:'Quizzes',subtitle:'Check understanding with automatically scored multiple-choice assessments.',endpoint:'/api/learning/quizzes/',permission:'learning',icon:'Quiz',
        fields:[course(),field('title','Quiz title','text',true),{...field('pass_percentage','Pass percentage','number'),min:0,default:60},{...field('max_attempts','Allowed attempts','number'),min:1,default:3},field('is_published','Published','checkbox')],
        columns:['title','course_title','pass_percentage','max_attempts','is_published']},
    questions:{title:'Question bank',subtitle:'Create clear questions and select the correct answer.',endpoint:'/api/learning/questions/',permission:'learning',icon:'Help',
        fields:[relation('quiz','Quiz','/api/learning/quizzes/','title',true),field('prompt','Question','textarea',true),field('option_a','Option A','text',true),field('option_b','Option B','text',true),field('option_c','Option C'),field('option_d','Option D'),select('correct_answer','Correct answer',['A','B','C','D']),{...field('position','Question order','number'),min:1,default:1}],
        columns:['prompt','quiz_title','correct_answer','position']}
};
