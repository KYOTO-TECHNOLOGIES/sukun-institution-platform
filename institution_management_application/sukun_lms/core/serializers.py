from rest_framework import serializers


class WritableModelSerializer(serializers.ModelSerializer):
    pass


def build_model_serializer(model):
    meta = type('Meta', (), {'model': model, 'fields': '__all__'})
    return type(f'{model.__name__}Serializer', (WritableModelSerializer,), {'Meta': meta})
