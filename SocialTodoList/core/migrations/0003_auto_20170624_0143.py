# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-06-24 01:43
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_auto_20170622_2047'),
    ]

    operations = [
        migrations.AlterField(
            model_name='item',
            name='done',
            field=models.BooleanField(default=False),
        ),
    ]
