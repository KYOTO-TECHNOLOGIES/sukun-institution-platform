"""Server-owned notification destinations. No client-supplied rooms or links."""
MODULE_LABELS = {
    'admissions': 'Admissions', 'academics': 'Academics', 'institutions': 'Institution',
    'students': 'Students', 'staff': 'Staff & leave', 'attendance': 'Attendance',
    'examinations': 'Examinations', 'exam_seating': 'Exam seating', 'learning': 'Learning',
    'tasks': 'Homework', 'finance': 'Fees & payments', 'library': 'Library',
    'communications': 'Notices & events', 'expenses': 'Expenses', 'payroll': 'Payroll',
    'assets': 'Assets', 'transport': 'Transport', 'hostel': 'Hostel', 'support': 'Support',
    'frontdesk': 'Front desk', 'pastoral': 'Student development', 'accounts': 'People & access',
}
# model label -> module, workspace destination, singular label
CATALOG = {}
def register(app, module, entries):
    for model, key, label in entries:
        CATALOG[app + '.' + model.lower()] = (module, '/workspace/' + key, label)

register('admissions', 'admissions', [('Campaign','campaigns','Campaign'),('Lead','enquiries','Enquiry'),('FollowUp','follow-ups','Follow-up'),('Application','applications','Application')])
register('academics', 'academics', [('Class','classes','Class'),('Division','divisions','Division'),('Syllabus','syllabi','Syllabus'),('Subject','subjects','Subject'),('ClassSubject','class-subjects','Teaching assignment'),('TimeTable','timetable','Timetable')])
register('institutions', 'institutions', [('Institution','institution-settings','Institution settings'),('AcademicYear','academic-years','Academic year')])
register('students', 'students', [('Student','students','Student profile'),('ParentGuardian','guardians','Guardian link'),('StudentCertificate','certificates','Certificate')])
register('students', 'pastoral', [('HifzProgress','hifz-progress','Memorization progress'),('PrayerAttendance','prayer-register','Prayer register'),('DisciplineRecord','student-support','Student support'),('Achievement','achievements','Achievement')])
register('staff', 'staff', [('Teacher','staff-profiles','Staff profile'),('StaffLeaveRecord','leave','Leave request'),('StaffNote','staff-profiles','Staff note')])
register('attendance', 'attendance', [('StudentAttendance','students','Attendance')])
CATALOG['attendance.studentattendance'] = ('attendance','/daily-attendance','Attendance')
register('attendance', 'staff', [('TeacherAttendance','staff-attendance','Staff attendance')])
register('examinations', 'examinations', [('ExamType','exam-periods','Exam period'),('Exam','exams','Exam schedule'),('ExamResult','results','Exam result')])
register('tasks', 'tasks', [('DailyTask','homework','Homework'),('TaskSubmission','homework-grading','Homework submission')])
register('learning', 'learning', [('Course','courses','Course'),('Lesson','lessons','Lesson'),('Enrollment','enrollments','Enrollment'),('Assignment','assignments','Assignment'),('Submission','grading','Assignment submission'),('Quiz','quizzes','Quiz'),('Question','questions','Quiz question'),('QuizAttempt','quizzes','Quiz attempt')])
register('finance', 'finance', [('FeeStructure','fee-catalog','Fee structure'),('StudentFee','student-bills','Student fee'),('FeePayment','receipts','Payment'),('FeeRefund','refunds','Refund')])
register('library', 'library', [('LibraryBook','books','Library book'),('BookIssue','loans','Book loan')])
register('communications', 'communications', [('IslamicEvent','events','Institution event'),('Notification','notices','Notice')])
register('accounts', 'accounts', [('User','accounts','Account')])
for model, module, key, label in [
    ('Expense','expenses','expenses','Expense'),('Payroll','payroll','payroll','Payroll'),
    ('Asset','assets','assets','Asset'),('TransportRoute','transport','transport-routes','Transport route'),
    ('TransportAllocation','transport','transport-allocation','Transport allocation'),
    ('HostelRoom','hostel','hostel-rooms','Hostel room'),('HostelAllocation','hostel','hostel-allocation','Hostel allocation'),
    ('SupportTicket','support','support','Support ticket'),('QueueTicket','frontdesk','queue','Visitor request'),
]:
    register('operations', module, [(model,key,label)])
for model, path, label in [
    ('ExamStudent','/exam-seating/students','Exam student'),('ExamSession','/sessions','Exam session'),
    ('ExamDay','/sessions','Exam day'),('ExamSubjectSchedule','/schedules','Subject schedule'),
    ('ExamRoom','/rooms','Exam room'),('RoomLayout','/rooms','Room layout'),
    ('SeatingRule','/rules','Seating rule'),('ClassProximityRule','/rules','Proximity rule'),
    ('ExamSeatingArrangement','/arrangements','Seating arrangement'),('ExamAttendance','/attendance','Exam attendance'),
    ('MalpracticeRecord','/malpractice','Exam incident'),
]:
    CATALOG['exam_seating.' + model.lower()] = ('exam_seating',path,label)

for model, path, label in [
    ('ExamInstitution','/','Exam institution'),('BenchTemplate','/rooms','Bench template'),
    ('LayoutRow','/rooms','Layout row'),('LayoutBench','/rooms','Layout bench'),('LayoutSeat','/rooms','Layout seat'),
    ('RoomAssignment','/arrangements','Room assignment'),('StudentSeatAssignment','/arrangements','Seat assignment'),
    ('TeacherInvigilation','/arrangements','Invigilation assignment'),('TeacherAvailability','/arrangements','Invigilation availability'),
]:
    CATALOG['exam_seating.' + model.lower()] = ('exam_seating',path,label)
