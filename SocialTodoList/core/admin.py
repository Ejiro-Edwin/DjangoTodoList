from django.contrib import admin

from .models import List, Item, ItemAdmin

admin.site.register(List)
admin.site.register(Item, ItemAdmin)
