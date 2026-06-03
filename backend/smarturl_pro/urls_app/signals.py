# urls_app/signals.py

import qrcode
from io import BytesIO
from django.core.files import File
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ShortURL


@receiver(post_save, sender=ShortURL)
def generate_qr_code(sender, instance, created, **kwargs):
    if not created or instance.qr_code:
        return

    short_url = f"http://localhost:8000/s/{instance.get_active_code()}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(short_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    instance.qr_code.save(
        f"qr_{instance.short_code}.png",
        File(buffer),
        save=True
    )