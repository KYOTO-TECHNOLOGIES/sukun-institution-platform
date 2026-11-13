import logging
from django.db import transaction
from .signals import current_batch

logger = logging.getLogger(__name__)

class NotificationEventsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method not in {'POST','PUT','PATCH','DELETE'} or not request.path.startswith('/api/') or request.path.startswith(('/api/notifications/', '/api/auth/')):
            return self.get_response(request)
        batch = {'request': request, 'changes': {}}
        token = current_batch.set(batch)
        try:
            response = self.get_response(request)
            user = getattr(request, 'user', None)
            if 200 <= response.status_code < 300 and user and user.is_authenticated and user.institution_id:
                changes = list(batch['changes'].values())
                if changes:
                    # No rolled-back or failed request may create a notification.
                    def deliver():
                        from .services import deliver_changes
                        try:
                            deliver_changes(user.pk, user.institution_id, changes)
                        except Exception:
                            logger.exception('Could not persist workflow notifications')
                    transaction.on_commit(deliver, robust=True)
            return response
        finally:
            current_batch.reset(token)
