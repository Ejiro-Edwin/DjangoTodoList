from django.conf.urls import url

from . import views

app_name = "core"
handler404 = 'SocialTodoList.core.views.show_lists'

urlpatterns = [
    url(r'^all/$', views.show_lists, name="show_lists"),
    # url(r'^create_list/$', views.create_list, name='create_list'),
    # url(r'^edit_list/(?P<list_id>\d+)/$', views.edit_list, name='edit_list'),
    # url(r'^edit_list/(?P<list_id>\d+)/add_item/$', views.add_item, name='add_item_to_list'),
    url(r'^edit_list/(?P<list_id>\d+)/delete_item/(?P<item_id>\d+)/$', views.delete_item, name='delete_item_from_list'),
    url(r'^edit_list/(?P<list_id>\d+)/toggle_done/(?P<item_id>\d+)/$', views.toggle_item_done, name='toggle_item_done'),
    url(r'^edit_list/(?P<list_id>\d+)/edit_item/(?P<item_id>\d+)/$', views.edit_item, name='edit_item'),


    url(r'^get_all_lists/$', views.get_all_lists, name="get_all_lists"),
    url(r'^create_list/$', views.create_new_list, name='create_list'),
    url(r'^get_list_info/(?P<list_id>\d+)/$', views.get_list_info, name='get_list_info'),
    url(r'^edit_list/(?P<list_id>\d+)/add_item/$', views.add_item_to_list, name='add_item_to_list'),

    url(r'^.*$', views.show_lists, name="not_found_handler"),
]
