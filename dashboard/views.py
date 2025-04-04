from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from resource_management.models import AccessRequest
from assets.models import AssetAssignment

@login_required
def employee_summary(request, user_id):
    employee = get_object_or_404(User, id=user_id)
    resources = AccessRequest.objects.filter(user=employee, status='APPROVED')
    assignment = AssetAssignment.objects.filter(employee=employee).first()
    assets = assignment.assets.all() if assignment else []

    context = {
        'employee': employee,
        'resources': resources,
        'assets': assets,
    }
    return render(request, 'dashboard/employee_summary.html', context)