import React, { lazy } from 'react';
import { allRoutesObject } from './RoutesMenu';
import { resources } from '../workspace/resources';
const LearnerPortal = lazy(() => import('../workspace/LearnerPortal'));
const ResourcePage = lazy(() => import('../workspace/ResourcePage')); 

const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const ClassesList = lazy(() => import('../pages/Academics/ClassesList'));
const AcademicYearList = lazy(() => import('../pages/Academics/AcademicYearList'));
const SyllabusList = lazy(() => import('../pages/Academics/SyllabusList'));
const SubjectList = lazy(() => import('../pages/Academics/SubjectList'));
const ClassSubjectList = lazy(() => import('../pages/Academics/ClassSubjectList'));
const TimeTableList = lazy(() => import('../pages/Academics/TimeTableList'));
const StudentsList = lazy(() => import('../pages/Students/StudentsList'));
const StudentDetail = lazy(() => import('../pages/Students/StudentDetail'));
const TeacherList = lazy(() => import('../pages/Staff/TeacherList'));
const TeacherDetail = lazy(() => import('../pages/Staff/TeacherDetail'));
const DailyAttendance = lazy(() => import('../pages/Attendance/DailyAttendance'));
const AcademicExams = lazy(() => import('../pages/Examinations/AcademicExams'));
const DailyTasks = lazy(() => import('../pages/Tasks/DailyTasks'));
const FeeManagement = lazy(() => import('../pages/Finance/FeeManagement'));
const LibraryManagement = lazy(() => import('../pages/Library/LibraryManagement'));
const Communications = lazy(() => import('../pages/Communications/Communications'));

const ExamStudentsList = lazy(() => import('../pages/ExamStudents/List'));
const SessionsList = lazy(() => import('../pages/Sessions/List'));
const SchedulesList = lazy(() => import('../pages/Schedules/List'));
const RoomsList = lazy(() => import('../pages/Rooms/List'));
const LayoutDetail = lazy(() => import('../pages/Rooms/LayoutDetail'));
const RulesList = lazy(() => import('../pages/Rules/List'));
const ArrangementsList = lazy(() => import('../pages/Arrangements/List'));
const ArrangementDetail = lazy(() => import('../pages/Arrangements/Detail'));
const AttendanceList = lazy(() => import('../pages/Attendance/List'));
const MalpracticeList = lazy(() => import('../pages/Malpractice/List'));

const contentRoutes = [
    {path:'/portal',element:<LearnerPortal />,exact:true,permissionKey:'portal_read'},
    ...Object.entries(resources).map(([key, config]) => ({path:'/workspace/'+key, element:<ResourcePage />, exact:true, permissionKey:config.permission+'_read'})),
	{
		path: allRoutesObject.dashboard.path,
		element: <Dashboard />,
		exact: true,
		permissionKey: allRoutesObject.dashboard.permissionKey,
	},
	{
		path: allRoutesObject.classes.path,
		element: <ClassesList />,
		exact: true,
		permissionKey: allRoutesObject.classes.permissionKey,
	},
	{
		path: allRoutesObject.academicYears.path,
		element: <AcademicYearList />,
		exact: true,
		permissionKey: allRoutesObject.academicYears.permissionKey,
	},
	{
		path: allRoutesObject.syllabi.path,
		element: <SyllabusList />,
		exact: true,
		permissionKey: allRoutesObject.syllabi.permissionKey,
	},
	{
		path: allRoutesObject.subjects.path,
		element: <SubjectList />,
		exact: true,
		permissionKey: allRoutesObject.subjects.permissionKey,
	},
	{
		path: allRoutesObject.classSubjects.path,
		element: <ClassSubjectList />,
		exact: true,
		permissionKey: allRoutesObject.classSubjects.permissionKey,
	},
	{
		path: allRoutesObject.timetable.path,
		element: <TimeTableList />,
		exact: true,
		permissionKey: allRoutesObject.timetable.permissionKey,
	},
	{
		path: allRoutesObject.students.path,
		element: <StudentsList />,
		exact: true,
		permissionKey: allRoutesObject.students.permissionKey,
	},
	{
		path: allRoutesObject.studentDetail.path,
		element: <StudentDetail />,
		exact: true,
		permissionKey: allRoutesObject.studentDetail.permissionKey,
	},
	{
		path: allRoutesObject.teachers.path,
		element: <TeacherList />,
		exact: true,
		permissionKey: allRoutesObject.teachers.permissionKey,
	},
	{
		path: allRoutesObject.teacherDetail.path,
		element: <TeacherDetail />,
		exact: true,
		permissionKey: allRoutesObject.teacherDetail.permissionKey,
	},
	{
		path: allRoutesObject.dailyAttendance.path,
		element: <DailyAttendance />,
		exact: true,
		permissionKey: allRoutesObject.dailyAttendance.permissionKey,
	},
	{
		path: allRoutesObject.academicExams.path,
		element: <AcademicExams />,
		exact: true,
		permissionKey: allRoutesObject.academicExams.permissionKey,
	},
	{
		path: allRoutesObject.dailyTasks.path,
		element: <DailyTasks />,
		exact: true,
		permissionKey: allRoutesObject.dailyTasks.permissionKey,
	},
	{
		path: allRoutesObject.feeManagement.path,
		element: <FeeManagement />,
		exact: true,
		permissionKey: allRoutesObject.feeManagement.permissionKey,
	},
	{
		path: allRoutesObject.library.path,
		element: <LibraryManagement />,
		exact: true,
		permissionKey: allRoutesObject.library.permissionKey,
	},
	{
		path: allRoutesObject.communications.path,
		element: <Communications />,
		exact: true,
		permissionKey: allRoutesObject.communications.permissionKey,
	},
	{
		path: allRoutesObject.examStudents.path,
		element: <ExamStudentsList />,
		exact: true,
		permissionKey: allRoutesObject.examStudents.permissionKey,
	},
	{
		path: allRoutesObject.sessions.path,
		element: <SessionsList />,
		exact: true,
		permissionKey: allRoutesObject.sessions.permissionKey,
	},
	{
		path: allRoutesObject.schedules.path,
		element: <SchedulesList />,
		exact: true,
		permissionKey: allRoutesObject.schedules.permissionKey,
	},
	{
		path: allRoutesObject.rooms.path,
		element: <RoomsList />,
		exact: true,
		permissionKey: allRoutesObject.rooms.permissionKey,
	},
	{
		path: allRoutesObject.roomLayoutDetail.path,
		element: <LayoutDetail />,
		exact: true,
		permissionKey: allRoutesObject.roomLayoutDetail.permissionKey,
	},
	{
		path: allRoutesObject.rules.path,
		element: <RulesList />,
		exact: true,
		permissionKey: allRoutesObject.rules.permissionKey,
	},
	{
		path: allRoutesObject.arrangements.path,
		element: <ArrangementsList />,
		exact: true,
		permissionKey: allRoutesObject.arrangements.permissionKey,
	},
	{
		path: allRoutesObject.arrangementDetail.path,
		element: <ArrangementDetail />,
		exact: true,
		permissionKey: allRoutesObject.arrangementDetail.permissionKey,
	},
	{
		path: allRoutesObject.attendance.path,
		element: <AttendanceList />,
		exact: true,
		permissionKey: allRoutesObject.attendance.permissionKey,
	},
	{
		path: allRoutesObject.malpractice.path,
		element: <MalpracticeList />,
		exact: true,
		permissionKey: allRoutesObject.malpractice.permissionKey,
	},
];

export default contentRoutes;
