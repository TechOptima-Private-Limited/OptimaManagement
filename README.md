# Django CMS Project with Email Service

This project is a content management system (CMS) built using [Django CMS](https://www.django-cms.org/). It includes an email service for sending emails to users.

## Features

- **Content Management**: Easily manage and organize web content.
- **Email Service**: Send emails to users using Django's email framework.
- **Custom Plugins**: Extend the application functionality with custom plugins.
- **Multilingual Support**: Create and manage content in multiple languages.
- **Media Management**: Upload and manage images and other media files.

---

## Installation and Setup

Follow these steps to set up the project locally:

### 1. Set Up Virtual Environment

Create and activate a virtual environment for the project.

```bash
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
```

### Install all required packages listed in requirements.txt

```bash
pip install -r requirements.txt
```

### Set up the database by applying migrations.
```bash
python manage.py makemigrations
```

```bash
python manage.py migrate
```

```bash
python manage.py setupdata
```

### Start the development server to access the application.

```bash
python manage.py runserver
```