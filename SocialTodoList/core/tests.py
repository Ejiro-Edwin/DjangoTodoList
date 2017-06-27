from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase, Client

from .models import List, Item


def create_user(name="admin"):
    User = get_user_model()
    user = User(username=name, password="admin1234")
    user.save()
    return user


def create_list(user, name="Test Script List"):
    test_list = List(owner=user, name=name)
    test_list.save()

    return test_list


def create_items_in_list(test_list):
    test_item_1 = Item(list=test_list, text="This is test item #1", deadline=datetime.now() + timedelta(days=1))
    test_item_2 = Item(list=test_list, text="This is test item #2", deadline=datetime.now() + timedelta(days=2))
    test_item_3 = Item(list=test_list, text="This is test item #3", deadline=datetime.now() + timedelta(days=3))

    Item.objects.bulk_create([test_item_1, test_item_2, test_item_3])


class DatabaseTests(TestCase):
    def setUp(self):
        user = create_user()
        test_list = create_list(user)
        create_items_in_list(test_list)

    def test_list_is_created(self):
        lists = List.objects.all()
        self.assertEqual(len(lists), 1)
        self.assertEqual(lists[0].name, "Test Script List")

    def test_items_added_to_list(self):
        test_list = List.objects.first()

        items = Item.objects.filter(list=test_list).order_by("order")

        self.assertEqual(len(items), 3)
        template_str = "This is test item #{}"
        self.assertEqual(items[0].text, template_str.format("1"))
        self.assertEqual(items[1].text, template_str.format("2"))
        self.assertEqual(items[2].text, template_str.format("3"))

