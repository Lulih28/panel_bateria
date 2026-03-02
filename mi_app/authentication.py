
import os
import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework import exceptions

# Initialize Firebase Admin
if not firebase_admin._apps:
    # 1. Try environment variable with JSON content
    firebase_json = os.environ.get('FIREBASE_CONFIG_JSON')
    
    if firebase_json:
        import json
        try:
            cred_dict = json.loads(firebase_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"Error loading FIREBASE_CONFIG_JSON: {e}")
            # Fallback to file
            cred = credentials.Certificate(os.path.join(settings.BASE_DIR, 'serviceAccountKey.json'))
            firebase_admin.initialize_app(cred)
    else:
        # 2. Fallback to file
        cred_path = os.path.join(settings.BASE_DIR, 'serviceAccountKey.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
             print("WARNING: Firebase service account key not found.")

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        id_token = auth_header.split(' ').pop()
        
        try:
            decoded_token = auth.verify_id_token(id_token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Invalid token: {e}')

        uid = decoded_token.get('uid')
        email = decoded_token.get('email', '')

        if not uid:
             raise exceptions.AuthenticationFailed('Token contained no UID')

        # Get or create the user
        try:
            # We use the firebase UID as username or we can link it otherwise.
            # Here we will try to match by email if possible, or create a new user with the UID as username
            user, created = User.objects.get_or_create(username=uid)
            
            if created:
                user.email = email
                user.save()
            
            return (user, None)
        except Exception as e:
            raise exceptions.AuthenticationFailed('User could not be created/found')
