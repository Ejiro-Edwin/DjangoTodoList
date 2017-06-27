from django.contrib import messages
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import Item, List


def show_lists(request):
    lists = List.objects.all()
    return render(request, "core/show_lists.html", {"lists": lists})


def create_list(request):
    try:
        user = User.objects.get(username="admin")
        new_list = List(name=request.POST.get("newListName"), owner=user)
        new_list.save()

        messages.success(request, "The list {} was created successfully!".format(new_list.name))
    except Exception as e:
        print(":::: ERROR:", e)
        messages.error(request, "There was an error while trying to create the list. Please try again.")

    return HttpResponseRedirect(reverse("core:show_lists"))


def edit_list(request, list_id):
    current_list = List.objects.get(id=list_id)
    items = Item.objects.filter(list__id=list_id).order_by('order')
    return render(request, "core/edit_list.html", {"items": items, "list": current_list})


def add_item(request, list_id):
    try:
        text = request.POST.get("newItemText")
        if text:
            current_list = List.objects.get(id=list_id)
            done = True if request.POST.get("newItemDone") else False
            new_item = Item(list=current_list, text=text, order=0, done=done)
            deadline = request.POST.get("newItemDeadline")
            if deadline:
                new_item.deadline = deadline
            new_item.save()

            messages.success(request, "The item {} was added successfully!".format(new_item.text))
        else:
            raise Exception("Not enough data provided for creating the item.")
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


def toggle_item_done(request, list_id, item_id):
    try:
        item = Item.objects.get(id=item_id)
        item.done = True if not item.done else False
        item.save()

        messages.success(request, "The item {} was marked as {}!".format(item.text, "done" if item.done else "not done"))
    except Exception as e:
        print(":::: ERROR:", e)
        messages.error(request, "There was an error while trying to edit the item. Please try again.")

    return HttpResponseRedirect(reverse("core:edit_list", kwargs={'list_id': list_id}))


def edit_item(request, list_id, item_id):
    item = Item.objects.get(id=item_id)

    if request.POST:
        try:
            item.text = request.POST.get("newItemText")
            item.done = True if request.POST.get("newItemDone") else False
            deadline = request.POST.get("newItemDeadline")
            if deadline:
                item.deadline = deadline
            item.save()

            messages.success(request, "The item {} was edited successfully!".format(item.text))
        except Exception as e:
            print(":::: ERROR:", e)
            messages.error(request, "There was an error while trying to edit the item. Please try again.")

        return HttpResponseRedirect(reverse("core:edit_item", kwargs={'list_id': list_id, 'item_id': item_id}))
    else:
        current_list = List.objects.get(id=list_id)
        return render(request, "core/edit_item.html", {'list': current_list, 'item': item})
