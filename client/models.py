from django.db import models

class ClientInformation(models.Model):
    page_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField()
    company = models.CharField(max_length=200, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    contact_reason = models.CharField(max_length=200, null=True, blank=True)
    message = models.TextField(null=True, blank=True)  
    job_title = models.CharField(max_length=200, null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.company}"

    class Meta:
        ordering = ['-created_at']