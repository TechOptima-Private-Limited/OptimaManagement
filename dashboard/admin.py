# from django.contrib import admin
# from django.urls import path
# from .views import employee_summary
# from django.contrib import admin

# class DashboardAdmin(admin.ModelAdmin):
#     def get_urls(self):
#         urls = super().get_urls()
#         custom_urls = [
#             path('employee/<int:user_id>/', self.admin_site.admin_view(employee_summary), name='employee_summary'),
#         ]
#         return custom_urls + urls

# # Register the dashboard in the admin sidebar
# admin.site.register(
#     'Dashboard',
#     [
#         {
#             'name': 'Employee Summary',
#             'url': 'dashboard_employee_summary',
#             'permissions': ['auth.view_user'],
#         }
#     ],
#     app_label='dashboard'
# )