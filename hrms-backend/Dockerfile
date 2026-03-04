# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app/hrm_keka

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    pkg-config \
    libcairo2-dev \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    tcl8.6-dev \
    tk8.6-dev \
    python3-dev \
    libpango1.0-dev \
    libgif-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Expose port
EXPOSE 8080

# The command to run the application will be provided in docker-compose.yml
# but we set a default here for standalone testing.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8080"]
