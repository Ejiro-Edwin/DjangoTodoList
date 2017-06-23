from django.contrib import messages
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import Item, List


def show_lists(request):
    lists = List.objects.all()
    return render(request, "core/show_lists.html", {"lists": lists})


def edit_list(request, list_id):
    list = List.objects.get(id=list_id)
    items = Item.objects.filter(list__id=list_id)
    return render(request, "core/edit_list.html", {"items": items, "list": list})


def add_item(request, list_id):
    try:
        current_list = List.objects.get(id=list_id)
        new_item = Item(list=current_list, text=request.POST.get("newItemText"), order=0, done=False)
        new_item.save()

        messages.success(request, "The item {} was added successfully!".format(new_item.text))
    except Exception as e:
        print(":::: ERROR:", e)
        messages.error(request, "There was an error while trying to add the item. Please try again.")

    return HttpResponseRedirect(reverse("core:edit_list", kwargs={'list_id': list_id}))


def delete_item(request, list_id, item_id):
    try:
        item = Item.objects.get(id=item_id)
        item.delete()

        messages.success(request, "The item {} was deleted successfully!".format(item.text))
    except Exception as e:
        print(":::: ERROR:", e)
        messages.error(request, "There was an error while trying to delete the item. Please try again.")

    return HttpResponseRedirect(reverse("core:edit_list", kwargs={'list_id': list_id}))
