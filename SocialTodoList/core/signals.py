from django.db.models.signals import post_save
from django.dispatch import receiver

from SocialTodoList.core.models import Item


@receiver(post_save, sender=Item)
def item_post_save_signal_handler(sender, created, instance, **kwargs):
    if created:
        items = Item.objects.filter(list=instance.list).order_by('-order')
        if items:
            instance.order = items[0].order + 1
        else:
            instance.order = 0

        instance.save(update_fields=["order"])
