from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = 'SocialTodoList.core'

    def ready(self):
        import SocialTodoList.core.signals  #noqa
