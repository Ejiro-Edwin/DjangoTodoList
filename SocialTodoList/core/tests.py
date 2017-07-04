import json
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase, Client

from .models import List, Item


def create_user(username="admin"):
    User = get_user_model()
    user = User(username=username, password="admin1234")
    user.save()
    return user


def create_list(user, name="Test Script List"):
    test_list = List(owner=user, name=name)
    test_list.save()

    return test_list


def create_items_in_list(test_list, items_text=None):
    if not items_text:
        items_text = ["This is test item #1", "This is test item #2", "This is test item #3"]

    # we could use bulk_create here, but it breaks the expected behavior from the 'post_save' signal:
    # since all items are saved at once, all of them will have the 'order' field with value 0.
    # hence, we have to save the items in the old-fashioned way.
    for i, item in enumerate(items_text):
        temp_item = Item(list=test_list, text=item, deadline=datetime.now() + timedelta(days=i + 1))
        temp_item.save()


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

    def test_create_lists_by_user(self):
        user = create_user(username="User2")
        test_list = create_list(user=user, name="List by User2")
        create_items_in_list(test_list=test_list, items_text=["Item #1 by User2", "Item #2 by User2"])

        lists_by_user2 = List.objects.filter(owner=user)
        items_by_user2 = Item.objects.filter(list__owner=user)
        self.assertEqual(len(lists_by_user2), 1)
        self.assertEqual(len(items_by_user2), 2)
        self.assertEqual(len(List.objects.all()), 2)
        self.assertEqual(len(Item.objects.all()), 5)


class RESTRequestsTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username='lucabezerra_', email='luca@lol.com', password='pass_word')
        self.client = Client()
        self.client.force_login(self.user, backend='social_core.backends.twitter.TwitterOAuth')
        self.list_name = "REST Test List"
        self.test_list = create_list(user=self.user, name=self.list_name)
        create_items_in_list(self.test_list)

    def test_get_all_lists(self):
        response = self.client.get(path="/get_all_lists/")
        data = response.json()

        lists = json.loads(data)
        self.assertIs(len(lists), 1)
        self.assertEqual(lists[0].get('fields', []).get('name'), self.list_name)

    def test_create_list(self):
        new_list_name = "New List from Test"
        json_content = json.dumps({"data": {"newListName": new_list_name}})
        response = self.client.post(path="/create_list/", data=json_content, content_type="application/json")
        data = response.json()

        created_list = json.loads(data.get("newList"))[0]
        self.assertEqual(created_list.get('fields', []).get('name'), new_list_name)

        db_list = List.objects.get(name=new_list_name)
        self.assertIsNotNone(db_list)

    def test_delete_list(self):
        response = self.client.post(path="/delete_list/{}/".format(self.test_list.id))
        data = response.json()
        message = data.get("message")
        self.assertIn("successfully", message)

    def test_get_list_info(self):
        response = self.client.post(path="/get_list_info/{}/".format(self.test_list.id))
        data = response.json()

        items = json.loads(data.get("items"))
        list_ = json.loads(data.get("list"))[0]

        self.assertIs(len(items), 3)
        self.assertEqual(list_.get('fields', []).get('name'), self.list_name)
        template_str = "This is test item #{}"
        self.assertEqual(items[0].get('fields', []).get('text'), template_str.format("1"))
        self.assertEqual(items[1].get('fields', []).get('text'), template_str.format("2"))
        self.assertEqual(items[2].get('fields', []).get('text'), template_str.format("3"))

    def test_add_item_to_list(self):
        item = Item(text="New Item from Text", done=False, deadline=datetime.now() + timedelta(days=5),
                    list=self.test_list)

        json_content = json.dumps(
            {"data":
                {
                    "newItemText": item.text,
                    "newItemDone": item.done,
                    "newItemDeadline": item.deadline.strftime("%Y-%m-%d")
                }
            }
        )

        response = self.client.post(path="/edit_list/{}/add_item/".format(self.test_list.id), data=json_content,
                                    content_type="application/json")
        data = response.json()

        created_item = json.loads(data.get("newItem"))[0]
        self.assertEqual(created_item.get('fields', []).get('text'), item.text)

        items = Item.objects.filter(list__id=self.test_list.id)
        self.assertIs(len(items), 4)

    def test_delete_item_from_list(self):
        items = Item.objects.filter(list__id=self.test_list.id)
        response = self.client.post(path="/edit_list/{}/delete_item/{}/".format(self.test_list.id, items[0].id))
        data = response.json()

        message = data.get("message")
        self.assertIn("successfully", message)

        items = Item.objects.filter(list__id=self.test_list.id)
        self.assertIs(len(items), 2)

    def test_toggle_item_done_from_list(self):
        items = Item.objects.filter(list__id=self.test_list.id)
        response = self.client.post(path="/edit_list/{}/toggle_done/{}/".format(self.test_list.id, items[0].id))
        data = response.json()

        message = data.get("message")
        self.assertIn("successfully", message)

        updated_item = json.loads(data.get("updatedItem"))[0]
        # 'items' holds the reference to the object in the DB, so when a field gets updated, it reflects this update
        self.assertIs(updated_item.get('fields', []).get('done'), items[0].done)
        self.assertIs(items[0].done, updated_item.get('fields', []).get('done'))

    def test_get_item_info(self):
        items = Item.objects.filter(list__id=self.test_list.id)
        response = self.client.post(path="/get_item_info/{}/".format(items[0].id))
        data = response.json()

        item = json.loads(data.get("item"))[0]
        list_ = json.loads(data.get("list"))[0]

        self.assertEqual(item.get('fields', []).get('text'), items[0].text)
        self.assertEqual(list_.get('pk', []), self.test_list.id)

    def test_edit_item_from_list(self):
        items = Item.objects.filter(list__id=self.test_list.id)
        text = "New Text"
        done = not items[0].done
        deadline = items[0].deadline + timedelta(days=1)
        deadline = deadline.strftime("%Y-%m-%d")

        json_content = json.dumps(
            {"data":
                {
                    "newItemText": text,
                    "newItemDone": done,
                    "newItemDeadline": deadline
                }
            }
        )

        response = self.client.post(path="/edit_list/{}/edit_item/{}/edit/".format(self.test_list.id, items[0].id),
                                    data=json_content, content_type="application/json")
        data = response.json()

        item = json.loads(data.get("item"))[0]
        list_ = json.loads(data.get("list"))[0]

        self.assertEqual(item.get('fields', []).get('text'), text)
        self.assertEqual(item.get('fields', []).get('done'), done)
        self.assertEqual(item.get('fields', []).get('deadline')[:10], deadline)  # comes as 2017-07-08T00:00:00 from DB
        self.assertEqual(list_.get('pk', []), self.test_list.id)
