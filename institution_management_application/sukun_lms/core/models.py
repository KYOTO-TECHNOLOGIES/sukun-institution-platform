from django.db import models
import uuid


class BaseModel(models.Model):
    """Abstract base model with common fields."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True


class AuditEvent(models.Model):
    institution = models.ForeignKey('institutions.Institution',on_delete=models.CASCADE)
    actor = models.ForeignKey('accounts.User',on_delete=models.SET_NULL,null=True)
    action = models.CharField(max_length=12)
    path = models.CharField(max_length=500)
    status_code = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering=['-created_at']
