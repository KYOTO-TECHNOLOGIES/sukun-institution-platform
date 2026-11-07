import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { allRoutesObject } from './RoutesMenu';
import { resources } from '../workspace/resources';
const LearnerPortal = lazy(() => import('../workspace/LearnerPortal'));
const ResourcePage = lazy(() => import('../workspace/ResourcePage')); 

const Dashboard = lazy(() => import('../workspace/Dashboard'));
const AccountPage = lazy(() => import('../workspace/AccountPage'));
const StudentDetail = lazy(() => import('../pages/Students/StudentDetail'));
const TeacherDetail = lazy(() => import('../pages/Staff/TeacherDetail'));
const DailyAttendance = lazy(() => import('../workspace/Attendance'));

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
    {path:'/account',element:<AccountPage />,exact:true,permissionKey:'dashboard_read'},
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
		element: <Navigate to="/workspace/classes" replace />,
		exact: true,
		permissionKey: allRoutesObject.classes.permissionKey,
	},
	{
		path: allRoutesObject.academicYears.path,
		element: <Navigate to="/workspace/academic-years" replace />,
		exact: true,
		permissionKey: allRoutesObject.academicYears.permissionKey,
	},
	{
		path: allRoutesObject.syllabi.path,
		element: <Navigate to="/workspace/syllabi" replace />,
		exact: true,
		permissionKey: allRoutesObject.syllabi.permissionKey,
	},
	{
		path: allRoutesObject.subjects.path,
		element: <Navigate to="/workspace/subjects" replace />,
		exact: true,
		permissionKey: allRoutesObject.subjects.permissionKey,
	},
	{
		path: allRoutesObject.classSubjects.path,
		element: <Navigate to="/workspace/class-subjects" replace />,
		exact: true,
		permissionKey: allRoutesObject.classSubjects.permissionKey,
	},
	{
		path: allRoutesObject.timetable.path,
		element: <Navigate to="/workspace/timetable" replace />,
		exact: true,
		permissionKey: allRoutesObject.timetable.permissionKey,
	},
	{
		path: allRoutesObject.students.path,
		element: <Navigate to="/workspace/students" replace />,
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
		element: <Navigate to="/workspace/staff-profiles" replace />,
		exact: true,
		permissionKey: 'staff_read',
	},
	{
		path: allRoutesObject.teacherDetail.path,
		element: <TeacherDetail />,
		exact: true,
		permissionKey: 'staff_read',
	},
	{
		path: allRoutesObject.dailyAttendance.path,
		element: <DailyAttendance />,
		exact: true,
		permissionKey: allRoutesObject.dailyAttendance.permissionKey,
	},
	{
		path: allRoutesObject.academicExams.path,
		element: <Navigate to="/workspace/exams" replace />,
		exact: true,
		permissionKey: 'examinations_read',
	},
	{
		path: allRoutesObject.dailyTasks.path,
		element: <Navigate to="/workspace/homework" replace />,
		exact: true,
		permissionKey: 'tasks_read',
	},
	{
		path: allRoutesObject.feeManagement.path,
		element: <Navigate to="/workspace/student-bills" replace />,
		exact: true,
		permissionKey: allRoutesObject.feeManagement.permissionKey,
	},
	{
		path: allRoutesObject.library.path,
		element: <Navigate to="/workspace/books" replace />,
		exact: true,
		permissionKey: allRoutesObject.library.permissionKey,
	},
	{
		path: allRoutesObject.communications.path,
		element: <Navigate to="/workspace/notices" replace />,
		exact: true,
		permissionKey: 'communications_read',
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
