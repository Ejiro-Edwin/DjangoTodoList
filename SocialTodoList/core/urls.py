from django.conf.urls import url, include
from django.contrib import admin

from . import views

app_name = "core"

urlpatterns = [
    url(r'^all/$', views.show_lists, name="show_lists"),
    url(r'^edit_list/(?P<list_id>\S+)/$', views.edit_list, name='edit_list'),
    url(r'^edit_list/(?P<list_id>\S+)/add_item/$', views.add_item, name='add_item_to_list'),
    url(r'^edit_list/(?P<list_id>\S+)/delete_item/(?P<item_id>\S+)/$', views.delete_item, name='delete_item_from_list'),
]
