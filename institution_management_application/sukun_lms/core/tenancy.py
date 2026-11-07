from functools import lru_cache
from django.db.models import Model
from rest_framework.exceptions import ValidationError


@lru_cache(maxsize=None)
def institution_path(model):
    """Find the shortest forward relationship to the owning institution."""
    queue = [(model, '')]
    seen = set()
    while queue:
        current, prefix = queue.pop(0)
        if current in seen:
            continue
        seen.add(current)
        if current._meta.label_lower == 'institutions.institution':
            return prefix + 'id'
        names = {field.name for field in current._meta.fields}
        if 'institution' in names:
            return prefix + 'institution_id'
        if 'external_institution_id' in names:
            return prefix + 'external_institution_id'
        for field in current._meta.fields:
            if field.is_relation and field.related_model:
                queue.append((field.related_model, prefix + field.name + '__'))
    return None


def owner_id(instance):
    path = institution_path(type(instance))
    if path is None:
        return None
    value = instance
    for part in path.split('__'):
        value = getattr(value, part, None)
        if value is None:
            return None
    return str(value)


def validate_relations(data, institution_id):
    for field, value in data.items():
        values = value if isinstance(value, (list, tuple)) else [value]
        for item in values:
            if isinstance(item, Model) and owner_id(item) != str(institution_id):
                raise ValidationError({field: 'Select a record belonging to this institution.'})
