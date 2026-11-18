from django.db import migrations


def backfill(apps, schema_editor):
    Institution = apps.get_model('institutions', 'Institution')
    Account = apps.get_model('saas', 'OrganizationAccount')
    for institution in Institution.objects.using(schema_editor.connection.alias).iterator():
        Account.objects.using(schema_editor.connection.alias).get_or_create(institution_id=institution.pk,
            defaults={'status': 'ACTIVE', 'billing_email': institution.email, 'enforce_overdue': True})


class Migration(migrations.Migration):
    dependencies = [('saas', '0001_initial')]
    operations = [migrations.RunPython(backfill, migrations.RunPython.noop)]
