from datetime import datetime
import json

import tweepy
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core import serializers
from django.http import HttpResponseRedirect
from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse
from social_django.models import UserSocialAuth
from tweepy import TweepError

from SocialTodoList import settings
from .models import Item, List


@login_required
def react_index(request):
    lists = List.objects.all()
    payload = {
        "name": request.user.first_name,
        "local_storage": {
            "sessionid": request.COOKIES.get("sessionid"),
            "csrftoken": request.COOKIES.get("csrftoken")
        },
        "lists": lists
    }
    return render(request, "core/react_index.html", payload)


@login_required
def get_all_lists(request):
    user = request.user

    lists = List.objects.filter(owner=user)
    data = serializers.serialize('json', lists)
    return JsonResponse(data, safe=False)


@login_required
def create_new_list(request):
    data = None
    try:
        data = json.loads(request.body.decode())['data']
        name = data.get("newListName")
        if name:
            user = request.user
            user = User.objects.get(username=user.get_username())  # TODO: change to the actual user's ID from request
            new_list = List(name=name, owner=user)
            new_list.save()

            data = serializers.serialize('json', [new_list])
            message = "The list {} was created successfully!".format(new_list.name)
        else:
            raise Exception("Not enough data provided for creating the list.")
    except Exception as e:
        print(":::: ERROR:", e)
        message = "There was an error while trying to create the list. Please try again."

    return JsonResponse({"message": message, "newList": data})


@login_required
def delete_list(request, list_id):
    try:
        user = User.objects.get(username=request.user.get_username())
        current_list = List.objects.get(id=list_id)

        if current_list.owner != user:
            raise Exception("Error: The requested list does not belong to the logged in user.")

        current_list.delete()

        message = "The list {} was deleted successfully!".format(current_list.name)
    except Exception as e:
        print(":::: ERROR:", e)
        message = "There was an error while trying to delete the list. Please try again."

    return JsonResponse({"message": message})


@login_required
def get_list_info(request, list_id):
    user = User.objects.get(username=request.user.get_username())
    current_list = List.objects.get(id=list_id)

    if current_list and current_list.owner != user:
        raise Exception("Error: The requested list does not belong to the logged in user.")

    items = Item.objects.filter(list__id=list_id).order_by('order')
    data = {
        "items": serializers.serialize('json', items),
        "list": serializers.serialize('json', [current_list])
    }
    return JsonResponse(data, safe=False)


@login_required
def add_item_to_list(request, list_id):
    data = None
    try:
        data = json.loads(request.body.decode())['data']
        text = data.get("newItemText")
        if text:
            user = User.objects.get(username=request.user.get_username())
            current_list = List.objects.get(id=list_id)

            if current_list and current_list.owner != user:
                raise Exception("Error: The requested list does not belong to the logged in user.")

            done = True if data.get("newItemDone") else False
            new_item = Item(list=current_list, text=text, order=0, done=done)
            deadline = data.get("newItemDeadline")
            if deadline:
                new_item.deadline = datetime.strptime(deadline, '%Y-%m-%d')
            new_item.save()

            data = serializers.serialize('json', [new_item])
            message = "The item {} was added successfully!".format(new_item.text)
        else:
            raise Exception("Not enough data provided for creating the item.")
    except Exception as e:
        print(":::: ERROR:", e)
        message = "There was an error while trying to add the item. Please try again."

    return JsonResponse({"message": message, "newItem": data})


@login_required
def delete_item_from_list(request, list_id, item_id):
    try:
        user = User.objects.get(username=request.user.get_username())
        current_list = List.objects.get(id=list_id)

        if current_list and current_list.owner != user:
            raise Exception("Error: The requested list does not belong to the logged in user.")

        item = Item.objects.get(id=item_id)
        item.delete()

        message = "The item {} was deleted successfully!".format(item.text)
    except Exception as e:
        print(":::: ERROR:", e)
        message = "There was an error while trying to delete the item. Please try again."

    return JsonResponse({"message": message})


@login_required
def toggle_item_done_from_list(request, list_id, item_id):
    data = None
    try:
        user = User.objects.get(username=request.user.get_username())
        current_list = List.objects.get(id=list_id)

        if current_list and current_list.owner != user:
            raise Exception("Error: The requested list does not belong to the logged in user.")

        item = Item.objects.get(id=item_id)
        item.done = True if not item.done else False
        item.save()

        data = serializers.serialize('json', [item])
        message = "The item {} was successfully marked as {}!".format(item.text, "done" if item.done else "not done")
    except Exception as e:
        print(":::: ERROR:", e)
        message = "There was an error while trying to edit the item. Please try again."

    return JsonResponse({"message": message, "updatedItem": data})


@login_required
def get_item_info(request, item_id):
    item = Item.objects.get(id=item_id)
    current_list = List.objects.get(id=item.list.id)

    user = User.objects.get(username=request.user.get_username())
    current_list = List.objects.get(id=current_list.id)

    if current_list and current_list.owner != user:
        raise Exception("Error: The requested list does not belong to the logged in user.")

    data = {
        "item": serializers.serialize('json', [item]),
        "list": serializers.serialize('json', [current_list])
    }
    return JsonResponse(data, safe=False)


@login_required
def edit_item_from_list(request, list_id, item_id):
    data = {}
    try:
        data = json.loads(request.body.decode())['data']
        text = data.get("newItemText")
        if text:
            user = User.objects.get(username=request.user.get_username())
            current_list = List.objects.get(id=list_id)

            if current_list and current_list.owner != user:
                raise Exception("Error: The requested list does not belong to the logged in user.")

            done = True if data.get("newItemDone") else False
            deadline = data.get("newItemDeadline")

            item = Item.objects.get(id=item_id)
            item.text = text
            item.done = done
            if deadline:
                item.deadline = datetime.strptime(deadline, '%Y-%m-%d')
            item.save()

            data = {
                "item": serializers.serialize('json', [item]),
                "list": serializers.serialize('json', [current_list])
            }

            message = "The item {} was edited successfully!".format(item.text)
        else:
            raise Exception("Not enough data provided for editing the item.")
    except Exception as e:
        print(":::: ERROR:", e)
        message = "There was an error while trying to edit the item. Please try again."

    data["message"] = message
    return JsonResponse(data, safe=False)


@login_required
def reorder_items(request, list_id):
    try:
        data = json.loads(request.body.decode())['data']
        items = data.get("items")
        if items:
            user = User.objects.get(username=request.user.get_username())
            current_list = List.objects.get(id=list_id)

            if current_list and current_list.owner != user:
                raise Exception("Error: The requested list does not belong to the logged in user.")

            for i, item in enumerate(items):
                db_item = Item.objects.get(id=item.get("pk"))
                db_item.order = i
                db_item.save()

            message = "The items were reordered successfully!"
        else:
            raise Exception("Not enough data provided for creating the item.")
    except Exception as e:
        print(":::: ERROR:", e)
        message = "There was an error while trying to reorder the items. Please REFRESH THE PAGE and try again."

    return JsonResponse({"message": message})


@login_required
def post_item_to_twitter(request):
    data = {}
    try:
        data = json.loads(request.body.decode())['data']
        item_id = data.get("itemId")
        list_id = data.get("listId")
        if item_id:
            user = User.objects.get(username=request.user.get_username())
            current_list = List.objects.get(id=list_id)

            if current_list and current_list.owner != user:
                raise Exception("Error: The requested list does not belong to the logged in user.")

            item = Item.objects.get(id=item_id)
            # post to twitter
            user_obj = UserSocialAuth.objects.get(user_id=request.user.id)
            tweepy_handler = generate_tweepy_handler(user_obj.extra_data['access_token']['oauth_token'],
                                                     user_obj.extra_data['access_token']['oauth_token_secret'])

            response = tweepy_handler.update_status(status="Yes! Task finished: {}".format(item.text))
            screen_name = response.user.screen_name
            status_id = response.id
            link = "https://twitter.com/{}/status/{}".format(screen_name, status_id)

            message = "The item {} was post successfully to Twitter! Here's your link: {}".format(item.text, link)
        else:
            raise Exception("Not enough data provided for posting to Twitter.")
    except TweepError as err:
        print(":::: ERROR:", err)
        if err.args and err.args[0]:
            error = err.args[0][0].get("message")
            message = "There was an error while trying to post to Twitter: {} Please try again.".format(error)
        else:
            message = "There was an error while trying to post to Twitter: {}. " \
                      "Please try again.".format(err.response.status_code)
    except Exception as e:
        print(":::: ERROR:", e)
        message = "There was an error while trying to post to Twitter. Please try again."

    data["message"] = message
    return JsonResponse(data, safe=False)


def generate_tweepy_handler(user_access_token, user_access_token_secret):
    """
    Generate handler object to use Tweepy's methods.
    :param user_access_token: The access token obtained from the signin process.
    :param user_access_token_secret: The access token secret.
    :return: The API handler.
    """
    consumer_key = settings.SOCIAL_AUTH_TWITTER_KEY
    consumer_secret = settings.SOCIAL_AUTH_TWITTER_SECRET
    access_key = user_access_token
    access_secret = user_access_token_secret
    auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
    auth.set_access_token(access_key, access_secret)
    handler = tweepy.API(auth)

    return handler


# --------------------------- #
# ---- DJANGO-ONLY VIEWS ---- #
# --------------------------- #
# for development purposes only


def create_list(request):
    try:
        user = User.objects.get(username="admin")  # TODO: change to the actual user's ID from request
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
