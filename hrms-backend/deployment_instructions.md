# Linux Depoyment Guide: Biometric Auto-Sync

To enable the automatic biometric device synchronization feature on your Linux production server, you must install Redis and configure Celery.

The Django backend code is fully complete. This guide explains how to configure the server to run the background processes.

## 1. Install Redis & Supervisor
Redis is the message broker that handles the background queues. Supervisor is a process manager that ensures Celery runs automatically in the background, even if the server restarts.

SSH into your Linux server and run the following:

```bash
sudo apt-get update
sudo apt-get install redis-server supervisor -y
```

Enable and start Redis:
```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## 2. Install Celery inside your Virtual Environment
Ensure your Django application's virtual environment is activated and `celery` is installed. Our `requirements.txt` already includes it.

```bash
cd /path/to/your/project/OptimaManagement/hrms-backend
source venv/bin/activate
pip install -r requirements.txt
```

## 3. Configure Supervisor for Celery Worker
The Celery Worker is responsible for actually executing the code that talks to the biometric devices.

Create a configuration file for the worker:
```bash
sudo nano /etc/supervisor/conf.d/hrm_celery_worker.conf
```

Add the following (replace `/path/to/project`, `your_user`, and your virtual environment paths appropriately):

```ini
[program:hrm_celery_worker]
command=/path/to/project/venv/bin/celery -A hrm_keka worker -l INFO
directory=/path/to/project/OptimaManagement/hrms-backend/hrm_keka
user=your_linux_user
autostart=true
autorestart=true
startsecs=10
needprocs=1
stopwaitsecs=600
redirect_stderr=true
stdout_logfile=/var/log/hrm_celery_worker.log
```

## 4. Configure Supervisor for Celery Beat
Celery Beat is the 1-minute timer scheduler that tells the Worker when to run.

Create a configuration file for the beat process:
```bash
sudo nano /etc/supervisor/conf.d/hrm_celery_beat.conf
```

Add the following configuration:

```ini
[program:hrm_celery_beat]
command=/path/to/project/venv/bin/celery -A hrm_keka beat -l INFO
directory=/path/to/project/OptimaManagement/hrms-backend/hrm_keka
user=your_linux_user
autostart=true
autorestart=true
startsecs=10
redirect_stderr=true
stdout_logfile=/var/log/hrm_celery_beat.log
```

## 5. Start the Services
Tell Supervisor to read the new configuration files and start the background sync process immediately!

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start hrm_celery_worker
sudo supervisorctl start hrm_celery_beat
```

## 6. Verification
You can watch the logs live to verify that Celery is checking your database every 1 minute and contacting biometric devices that have `auto_sync_enabled` turned on.

```bash
tail -f /var/log/hrm_celery_worker.log
```

You are all set! The React Frontend UI will now seamlessly manage your production Celery background tasks.
