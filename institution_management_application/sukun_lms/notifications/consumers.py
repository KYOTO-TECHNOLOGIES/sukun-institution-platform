import asyncio
from http.cookies import SimpleCookie
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from .services import user_room

@database_sync_to_async
def authenticated_user(raw_token):
    try:
        auth = JWTAuthentication()
        token = auth.get_validated_token(raw_token)
        user = auth.get_user(token)
        return user if user.is_active and user.institution_id else None
    except Exception:
        return None

class InboxConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room = None
        self.watchdog = None
        cookie = SimpleCookie()
        try:
            cookie.load(dict(self.scope.get('headers', [])).get(b'cookie', b'').decode('latin1'))
            self.raw_token = cookie[settings.JWT_AUTH['ACCESS_COOKIE_NAME']].value
        except (KeyError, ValueError):
            await self.close(code=4401)
            return
        user = await authenticated_user(self.raw_token)
        if not user:
            await self.close(code=4401)
            return
        self.identity = (user.institution_id, user.pk)
        self.room = user_room(*self.identity)
        try:
            await self.channel_layer.group_add(self.room, self.channel_name)
        except Exception:
            await self.close(code=1013)
            return
        await self.accept()
        self.watchdog = asyncio.create_task(self.check_session())
        await self.send_json({'type': 'notifications.ready'})

    async def valid_session(self):
        user = await authenticated_user(self.raw_token)
        if not user or (user.institution_id, user.pk) != self.identity:
            await self.close(code=4401)
            return False
        return True

    async def check_session(self):
        while True:
            await asyncio.sleep(30)
            if not await self.valid_session():
                break

    async def receive_json(self, content, **kwargs):
        # Clients cannot select rooms or send events to another user.
        if isinstance(content, dict) and content.get('type') == 'ping' and await self.valid_session():
            await self.send_json({'type': 'pong'})

    async def notifications_changed(self, event):
        if await self.valid_session():
            await self.send_json({'type': 'notifications.changed', 'ids': event.get('ids', []), 'reason': event.get('reason', 'created')})

    async def disconnect(self, close_code):
        if self.watchdog:
            self.watchdog.cancel()
        if self.room:
            try:
                await self.channel_layer.group_discard(self.room, self.channel_name)
            except Exception:
                pass
