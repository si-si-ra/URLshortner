# accounts/serializers.py

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=True,
        min_length=3,
        max_length=150,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="This username is already taken. Please choose another one."
            )
        ],
        error_messages={
            "blank": "Username is required.",
            "required": "Username is required.",
            "min_length": "Username must be at least 3 characters long.",
            "max_length": "Username must be 150 characters or fewer.",
        }
    )
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="An account with this email already exists."
            )
        ],
        error_messages={
            "blank": "Email address is required.",
            "required": "Email address is required.",
            "invalid": "Enter a valid email address.",
        }
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        error_messages={
            "blank": "Password is required.",
            "required": "Password is required.",
        }
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        error_messages={
            "blank": "Please confirm your password.",
            "required": "Please confirm your password.",
        }
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({
                "password2": "Passwords do not match."
            })
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'date_joined')
