"""Persist one delivery per recipient/workflow, then wake that user's private room."""
import asyncio
import logging
from collections import defaultdict
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from core.permissions import can_access
from .catalog import CATALOG
from .models import InboxItem

logger = logging.getLogger(__name__)

def user_room(institution_id, user_id):
    return f'notifications.{institution_id}.{user_id}'

def publish_batch(institution_id, recipients, reason='created'):
    async def send():
        layer = get_channel_layer()
        await asyncio.wait_for(asyncio.gather(*(
            layer.group_send(user_room(institution_id, user_id), {
                'type': 'notifications.changed', 'ids': [str(pk) for pk in ids][:100], 'reason': reason,
            }) for user_id, ids in recipients.items()
        )), timeout=3)
    try:
        async_to_sync(send)()
    except Exception:
        # Bound live delivery time; committed inbox records remain available through HTTP.
        logger.warning('Live notification delivery unavailable', exc_info=True)

def publish_changed(institution_id, user_id, ids=None, reason='created'):
    publish_batch(institution_id, {user_id: ids or []}, reason)

def course_for(obj):
    label = obj._meta.model_name
    if obj._meta.app_label != 'learning':
        return None
    if label == 'course':
        return obj
    if hasattr(obj, 'course_id'):
        return obj.course
    if hasattr(obj, 'assignment_id'):
        return obj.assignment.course
    if hasattr(obj, 'quiz_id'):
        return obj.quiz.course
    return None

def staff_owner(obj):
    if obj._meta.label_lower == 'staff.teacher':
        return obj.user_id
    if obj._meta.app_label == 'staff' or obj._meta.label_lower == 'attendance.teacherattendance':
        return obj.teacher.user_id
    if obj._meta.label_lower == 'operations.supportticket':
        return obj.created_by_id
    return None

def family_students(obj, deleted, created=False):
    from students.models import Student
    if deleted or not getattr(obj, 'is_active', True):
        return Student.objects.none()
    label = obj._meta.label_lower
    student_id = None
    if label == 'finance.feestructure' and created and obj.is_mandatory:
        return Student.objects.filter(fees__fee_structure=obj, is_active=True).distinct()
    if label in {'finance.studentfee', 'attendance.studentattendance', 'examinations.examresult', 'tasks.tasksubmission'}:
        student_id = obj.student_id
    elif label == 'finance.feepayment':
        student_id = obj.student_fee.student_id
    elif label == 'finance.feerefund':
        student_id = obj.payment.student_fee.student_id
    elif label == 'students.student':
        student_id = obj.pk
    elif label in {'students.parentguardian', 'students.studentcertificate', 'students.hifzprogress', 'students.prayerattendance', 'students.disciplinerecord', 'students.achievement', 'operations.transportallocation', 'operations.hostelallocation'}:
        student_id = obj.student_id
    elif label == 'tasks.dailytask':
        return Student.objects.filter(division_id=obj.division_id, is_active=True)
    elif obj._meta.app_label == 'learning':
        course = course_for(obj)
        if not course or not course.is_active or course.status != 'PUBLISHED':
            return Student.objects.none()
        if label in {'learning.lesson', 'learning.assignment', 'learning.quiz'} and not obj.is_published:
            return Student.objects.none()
        if label in {'learning.question', 'learning.quizattempt'}:
            return Student.objects.none()
        if label == 'learning.submission':
            if obj.score is None or not obj.assignment.is_published:
                return Student.objects.none()
            student_id = obj.enrollment.student_id
        elif label == 'learning.enrollment':
            student_id = obj.student_id
        else:
            return Student.objects.filter(course_enrollments__course=course, course_enrollments__status__in=['ACTIVE', 'COMPLETED'], course_enrollments__is_active=True, is_active=True).distinct()
    if label == 'examinations.examresult' and not obj.exam.exam_type.is_published:
        return Student.objects.none()
    if label == 'examinations.examtype' and obj.is_published:
        return Student.objects.filter(exam_results__exam__exam_type=obj, is_active=True).distinct()
    if label == 'tasks.tasksubmission' and obj.status != 'EVALUATED':
        return Student.objects.none()
    return Student.objects.filter(pk=student_id, is_active=True) if student_id else Student.objects.none()

def deliver_changes(actor_id, institution_id, changes):
    users = list(get_user_model().objects.filter(institution_id=institution_id, is_active=True).exclude(pk=actor_id))
    by_id = {user.pk: user for user in users}
    pending = {}
    for change in changes:
        obj, before = change['instance'], change['before']
        if change['institution_id'] != str(institution_id):
            continue
        key = obj._meta.label_lower
        module, path, label = CATALOG[key]
        deleted = change['deleted']
        if not deleted and before == change['after'] and not change['forced']:
            continue
        created = before is None and not deleted
        action = 'removed' if deleted else 'created' if created else 'updated'
        status = getattr(obj, 'status', None)
        status_changed = status and (before or {}).get('status') != status
        course = None if deleted and key == 'learning.course' else course_for(obj)
        staff_id = staff_owner(obj)
        private = getattr(obj, 'is_private', False)
        attention = (key in {'staff.staffleaverecord', 'operations.expense', 'operations.payroll'} and (created or status_changed))
        attention = attention or (key == 'operations.supportticket' and (status_changed or getattr(obj, 'priority', '') == 'URGENT'))
        attention = attention or (key in {'learning.submission', 'tasks.tasksubmission'} and created)
        title = f'{label} {str(status).replace("_", " ").lower()}' if status_changed and not created and not deleted else f'{label} {action}'
        message = f'{label} {action}. Open the record to see the latest details.'
        href = path
        if not deleted and path.startswith('/workspace/') and key not in {'staff.staffnote','learning.question','learning.quizattempt'}:
            href += '/' + change['pk']
        if key in {'learning.question','learning.quizattempt'} and course:
            href = '/workspace/quizzes/' + str(obj.quiz_id)
        if key == 'staff.staffnote':
            href = '/workspace/staff-profiles/' + str(obj.teacher_id)
        if deleted:
            InboxItem.objects.filter(institution_id=institution_id, href=path + '/' + change['pk']).update(href=path)
            message = f'{label} was removed from the workspace.'

        def add(user, scope='module', student=None, notice=None, title_override=None, message_override=None, href_override=None, urgent=None):
            identity = (user.pk, key, scope, str(student.pk) if student else '', str(course.pk) if course else '', staff_id, str(notice.pk) if notice else '')
            if identity in pending:
                pending[identity]['count'] += 1
                pending[identity]['item'].href = path if scope == 'module' else pending[identity]['item'].href
                return
            pending[identity] = {
                'count': 1, 'label': label,
                'item': InboxItem(
                    recipient=user, institution_id=institution_id, module=module, scope=scope,
                    student=student, notice=notice, course=course, staff_user_id=staff_id,
                    staff_private=private, exam_period=(obj if key == 'examinations.examtype' else obj.exam.exam_type) if key in {'examinations.examtype','examinations.examresult'} and not deleted else None,
                    title=(title_override or title)[:200], message=(message_override or message)[:600],
                    href=href if href_override is None else href_override,
                    attention=bool(attention if urgent is None else urgent),
                ),
            }

        if key == 'communications.notification':
            if not deleted and obj.is_active:
                for recipient_id in obj.recipients.values_list('pk', flat=True):
                    if recipient_id in by_id:
                        recipient = by_id[recipient_id]
                        add(recipient, scope='notice', notice=obj, title_override=obj.title,
                            message_override=obj.message, href_override='', urgent=True)
            continue
        for user in users:
            if not can_access(user, module):
                continue
            if user.user_type == 'TEACHER' and not user.is_superuser:
                if module == 'learning' and (not course or course.teacher_id != user.pk):
                    continue
                if module in {'staff','support'} and (staff_id != user.pk or private):
                    continue
            # Settings links are only available to administrators in the workspace.
            destination = '/' if module == 'institutions' and user.user_type not in {'INSTITUTION_ADMIN','PRINCIPAL'} else href
            add(user, href_override=destination)

        for student in family_students(obj, deleted, created).filter(institution_id=institution_id):
            family_ids = set(student.parents.filter(is_active=True).values_list('user_id', flat=True)) | {student.user_id}
            tab = {'finance':'fees', 'attendance':'attendance', 'examinations':'results', 'tasks':'homework', 'learning':'learning'}.get(module, 'learning')
            family_title = title
            family_message = f'An update is available for {student.user.get_full_name()}.'
            urgent = module in {'finance','examinations','tasks'}
            if key == 'attendance.studentattendance':
                family_title = f'Attendance: {obj.status.replace("_", " ").lower()}'
                family_message = f'{student.user.get_full_name()} Â· {obj.date}. Check the attendance register for details.'
                urgent = obj.status in {'ABSENT','LATE'}
            elif key == 'learning.submission':
                family_title = 'Assignment feedback is ready'
                urgent = True
            elif module == 'learning':
                urgent = created or (before or {}).get('is_published') is False and getattr(obj, 'is_published', False)
                family_title = f'{label} available' if key != 'learning.enrollment' else 'Enrollment updated'
            for user_id in family_ids:
                user = by_id.get(user_id)
                if user and user.user_type in {'STUDENT','PARENT'}:
                    add(user, scope='student', student=student, title_override=family_title, message_override=family_message,
                        href_override=f'/portal?student={student.pk}&tab={tab}', urgent=urgent)

        # Direct personal events are safe even when the user cannot browse that module.
        direct_id = getattr(obj, 'borrower_id', None) if key == 'library.bookissue' else getattr(obj, 'employee_id', None) if key == 'operations.payroll' else obj.pk if key == 'accounts.user' else None
        if direct_id in by_id and not can_access(by_id[direct_id], module) and not deleted:
            add(by_id[direct_id], scope='personal', title_override=title,
                message_override=f'Your {label.lower()} has been updated.', href_override='/account' if module == 'accounts' else '', urgent=bool(status_changed))

    deliveries = []
    for value in pending.values():
        item = value['item']
        if value['count'] > 1:
            item.title = f'{value["count"]} {value["label"].lower()} updates'
            item.message = 'Several records changed together. Open the module to review the latest information.'
        deliveries.append(item)
    if not deliveries:
        return
    with transaction.atomic():
        InboxItem.objects.bulk_create(deliveries)
        grouped = defaultdict(list)
        for item in deliveries:
            grouped[item.recipient_id].append(item.id)
        transaction.on_commit(lambda: publish_batch(institution_id, grouped))
