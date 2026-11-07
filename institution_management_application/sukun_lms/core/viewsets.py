from rest_framework import permissions, viewsets


class SecureModelViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    institution_lookup = None

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        if user.is_superuser or self.institution_lookup is None:
            return queryset

        user_institution_id = getattr(user, 'institution_id', None)
        if user_institution_id is not None:
            queryset = queryset.filter(**{self.institution_lookup: user_institution_id})

        # Apply query parameter filters
        query_params = self.request.query_params
        filter_kwargs = {}
        model_fields = [f.name for f in queryset.model._meta.get_fields()]
        for param, val in query_params.items():
            if val:
                base_param = param.split('__')[0]
                if base_param in model_fields or param in model_fields:
                    filter_kwargs[param] = val
        if filter_kwargs:
            queryset = queryset.filter(**filter_kwargs)

        return queryset


def build_model_viewset(model, serializer_class, institution_lookup=None):
    attrs = {
        'queryset': model.objects.all(),
        'serializer_class': serializer_class,
        'institution_lookup': institution_lookup,
    }
    return type(f'{model.__name__}ViewSet', (SecureModelViewSet,), attrs)
