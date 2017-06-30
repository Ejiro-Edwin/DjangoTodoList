from django.db import models
from django.contrib import admin
from django.contrib.auth.models import User


class List(models.Model):
    owner = models.ForeignKey(User)
    name = models.CharField(max_length=200)

    def __str__(self):
        return "{} by {}".format(self.name, self.owner)


class Item(models.Model):
    list = models.ForeignKey(List)
    text = models.CharField(max_length=200)
    order = models.IntegerField(default=0)
    done = models.BooleanField(default=False)
    deadline = models.DateTimeField(null=True)

    def __str__(self):
        return "{} ({})".format(self.text, "done" if self.done else "not done")


class ItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'text', 'list', 'order', 'done', 'deadline')
