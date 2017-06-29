# This is not recommended after Django 1.7, according to the docs. However, django.js was not allowing me to name the
# app like this in INSTALLED_APPS (it said there was no module named 'apps') and I needed to reference the app's Config
# class in order to connect signals according to Django's docs' recommendation (in CoreConfig's ready() method), so I
# had to use this as a workaround.
default_app_config = 'SocialTodoList.core.apps.CoreConfig'
