# from rest_framework import status
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated, AllowAny
# from rest_framework.response import Response
# from django.http import JsonResponse
# from django.shortcuts import get_object_or_404, render, redirect
# from django.core.files.base import ContentFile
# from django.utils import timezone
# from django.contrib import messages
# from django.core.mail import EmailMessage
# from django.http import Http404
# from .models import Employee, Offboarding
# from employees.models import Employee as CoreEmployee, Department as CoreDepartment
# from authentication.models import User, UserProfile
# from .serializers import EmployeeSerializer, OffboardingSerializer, EmployeeSelfSubmitSerializer
# from .forms import EmployeeSelfOnboardingForm
# import base64
# import time
# from datetime import datetime, timedelta
# import uuid

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404, render, redirect
from django.utils import timezone
from django.contrib import messages
from django.core.mail import EmailMessage

from .models import Employee, Offboarding
from employees.models import Employee as CoreEmployee, Department as CoreDepartment
from authentication.models import User, UserProfile
from .serializers import EmployeeSerializer, OffboardingSerializer, EmployeeSelfSubmitSerializer
from utils.roles import can_manage_hr, has_executive_access

import base64
from datetime import datetime, timedelta
import uuid


def _user_role(user):
    profile = getattr(user, 'profile', None)
    return getattr(profile, 'role', None) if profile else None


def can_manage_onboarding(user):
    """Allow HR managers/executives and executive leadership."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    role = _user_role(user)
    return can_manage_hr(role) or has_executive_access(role)


def can_create_onboarding(user):
    """Create follows same access as onboarding management."""
    return can_manage_onboarding(user)


def can_delete_onboarding(user):
    """Delete is restricted to management/executive access."""
    return can_manage_onboarding(user)

# # Employee Management API Views
# @api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])
# def employee_list(request):
#     """Get list of employees with filtering options or create new employee"""
#     if request.method == 'GET':
#         try:
#             # Check for filter parameters
#             status_filter = request.GET.get('status')
#             deleted_only = request.GET.get('deleted_only', 'false').lower() == 'true'
#             active_only = request.GET.get('active_only', 'false').lower() == 'true'
            
#             if deleted_only:
#                 # Show only soft-deleted employees
#                 employees = Employee.all_objects.filter(is_deleted=True)
#             elif active_only:
#                 # Show only active employees (default manager excludes deleted)
#                 employees = Employee.objects.all()
#             else:
#                 # Show all employees including deleted ones
#                 employees = Employee.all_objects.all()
            
#             # Apply status filter if provided
#             if status_filter and status_filter in ['pending', 'accepted', 'rejected']:
#                 employees = employees.filter(status=status_filter)
            
#             serializer = EmployeeSerializer(employees, many=True)
#             return Response({'results': serializer.data})
            
#         except Exception as e:
#             return Response(
#                 {'error': f'Failed to fetch employees: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
    
#     elif request.method == 'POST':
#         return employee_create(request)

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def employee_create(request):
#     """Create a new employee"""
#     try:
#         serializer = EmployeeSerializer(data=request.data)
#         if serializer.is_valid():
#             employee = serializer.save()
#             return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#     except Exception as e:
#         return Response(
#             {'error': f'Failed to create employee: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def employee_list_documents(request, employee_id):
#     """List uploaded documents for an employee with absolute URLs"""
#     try:
#         # First try to find the onboarding employee directly
#         employee = Employee.objects.filter(id=employee_id).first()
        
#         # If not found, try to find by core employee's email
#         if not employee:
#             core_emp = CoreEmployee.objects.filter(id=employee_id).select_related('user').first()
#             if core_emp and core_emp.user:
#                 # Try to find onboarding record by email
#                 email = getattr(core_emp.user, 'email', None)
#                 if email:
#                     employee = Employee.objects.filter(email__iexact=email).first()
        
#         # If still no onboarding employee found, return empty documents
#         if not employee:
#             # Get basic info from core employee for the response
#             core_emp = CoreEmployee.objects.filter(id=employee_id).select_related('user').first()
#             employee_name = 'Unknown'
#             if core_emp and core_emp.user:
#                 employee_name = f"{core_emp.user.first_name or ''} {core_emp.user.last_name or ''}".strip() or core_emp.user.email
            
#             return Response({
#                 'employee_id': employee_id,
#                 'employee_name': employee_name,
#                 'total_documents': 0,
#                 'documents': [],
#                 'message': 'No onboarding documents available for this employee'
#             })

#         doc_mappings = [
#             ('Aadhar and PAN Card', 'aadhar_pan_file'),
#             ('Last 6 months payslips', 'payslips_file'),
#             ('Educational Certificates (Degree)', 'educational_certificates_file'),
#             ('Previous Offer Letter', 'previous_offer_letter_file'),
#             ('Relieving & Experience Letters', 'relieving_experience_letters_file'),
#             ('Appraisal/Hike Letters', 'appraisal_hike_letters_file'),
#         ]

#         documents = []
#         for doc_type, field_name in doc_mappings:
#             file_field = getattr(employee, field_name, None)
#             if file_field:
#                 try:
#                     url = request.build_absolute_uri(file_field.url)
#                 except Exception:
#                     url = None
#                 documents.append({
#                     'doc_type': doc_type,
#                     'field': field_name,
#                     'name': getattr(file_field, 'name', None),
#                     'url': url,
#                 })

#         return Response({
#             'employee_id': employee.id,
#             'employee_name': employee.full_name,
#             'total_documents': len(documents),
#             'documents': documents,
#         })

#     except Exception as e:
#         return Response(
#             {'error': f'Failed to list documents: {str(e)}'},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

# @api_view(['PUT'])
# @permission_classes([IsAuthenticated])
# def employee_update(request, employee_id):
#     """Update an employee"""
#     try:
#         employee = get_object_or_404(Employee.all_objects, id=employee_id)
#         serializer = EmployeeSerializer(employee, data=request.data, partial=True)
#         if serializer.is_valid():
#             employee = serializer.save()
#             return Response(EmployeeSerializer(employee).data)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#     except Exception as e:
#         return Response(
#             {'error': f'Failed to update employee: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def employee_soft_delete(request, employee_id):
#     """Soft delete an employee"""
#     try:
#         employee = get_object_or_404(Employee.all_objects, id=employee_id)
#         if not employee.is_deleted:
#             employee.soft_delete()
#             return Response({'message': 'Employee soft deleted successfully'})
#         return Response({'error': 'Employee is already deleted'}, status=status.HTTP_400_BAD_REQUEST)
#     except Exception as e:
#         return Response(
#             {'error': f'Failed to delete employee: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def employee_restore(request, employee_id):
#     """Restore a soft deleted employee"""
#     try:
#         employee = get_object_or_404(Employee.all_objects, id=employee_id)
#         if employee.is_deleted:
#             employee.restore()
#             return Response({'message': 'Employee restored successfully'})
#         return Response({'error': 'Employee is not deleted'}, status=status.HTTP_400_BAD_REQUEST)
#     except Exception as e:
#         return Response(
#             {'error': f'Failed to restore employee: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def employee_update_status(request, employee_id):
#     """Update employee status (pending/accepted/rejected)"""
#     try:
#         employee = get_object_or_404(Employee.objects, id=employee_id)
#         new_status = request.data.get('status')
        
#         if new_status not in ['pending', 'accepted', 'rejected']:
#             return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
#         employee.status = new_status
#         employee.save()

#         # When accepted, sync into core Employees app so it shows up in Employees list
#         if new_status == 'accepted':
#             # 1) Ensure a User exists for this onboarding record
#             user = None
#             try:
#                 user = User.objects.get(email=employee.email)
#             except User.DoesNotExist:
#                 # Create a basic user with unusable password
#                 base_username = (employee.email.split('@')[0] if employee.email else f"user_{employee.id}")
#                 username = base_username
#                 suffix = 1
#                 while User.objects.filter(username=username).exists():
#                     username = f"{base_username}{suffix}"
#                     suffix += 1
#                 user = User.objects.create_user(
#                     username=username,
#                     email=employee.email,
#                     first_name=employee.first_name or '',
#                     last_name=employee.last_name or ''
#                 )
#                 user.set_unusable_password()
#                 user.save()
#                 # Ensure a profile exists
#                 UserProfile.objects.get_or_create(user=user)

#             # 2) Ensure Departments exist in core system (seed if empty)
#             if CoreDepartment.objects.count() == 0:
#                 default_departments = [
#                     'Human Resources','Information Technology','Finance','Marketing','Sales',
#                     'Operations','Development','Design','Quality Assurance','Customer Support'
#                 ]
#                 CoreDepartment.objects.bulk_create(
#                     [CoreDepartment(name=name) for name in default_departments]
#                 )

#             # 3) Map department (from onboarding code to Department name) if possible
#             dept_label_map = dict(Employee.DEPARTMENT_CHOICES)
#             core_department = None
#             if employee.department:
#                 label = dept_label_map.get(employee.department, employee.department)
#                 # Try exact (case-insensitive) name match in core Department
#                 core_department = CoreDepartment.objects.filter(name__iexact=label).first()
#                 # If not found, create it to keep systems in sync
#                 if not core_department and label:
#                     core_department = CoreDepartment.objects.create(name=label)

#             # 4) Map position code to human-readable label
#             pos_label_map = dict(Employee.POSITION_CHOICES)
#             position_label = pos_label_map.get(employee.position, employee.position)

#             # 5) Create or update CoreEmployee for this user (idempotent)
#             core_emp, created = CoreEmployee.objects.get_or_create(user=user, defaults={
#                 'department': core_department,
#                 'position': position_label or '',
#                 'hire_date': employee.joining_date,
#                 # Start as INACTIVE after HR acceptance; will flip to ACTIVE when admin creates account
#                 'status': 'INACTIVE',
#             })
#             if not created:
#                 # Update fields if they changed
#                 updated = False
#                 if core_emp.department != core_department:
#                     core_emp.department = core_department
#                     updated = True
#                 if (position_label or '') != (core_emp.position or ''):
#                     core_emp.position = position_label or ''
#                     updated = True
#                 if employee.joining_date and core_emp.hire_date != employee.joining_date:
#                     core_emp.hire_date = employee.joining_date
#                     updated = True
#                 # Keep INACTIVE until admin creates the account
#                 if core_emp.status != 'INACTIVE':
#                     core_emp.status = 'INACTIVE'
#                     updated = True
#                 if updated:
#                     core_emp.save()

#         return Response({'message': f'Status updated to {new_status}'})
#     except Exception as e:
#         return Response(
#             {'error': f'Failed to update status: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def employee_documents_status(request, employee_id):
#     """Get employee document status"""
#     try:
#         employee = get_object_or_404(Employee.objects, id=employee_id)
        
#         # Check required documents
#         required_docs = [
#             ('aadhar_pan_collected', 'aadhar_pan_file', 'Aadhar and PAN Card'),
#             ('payslips_collected', 'payslips_file', 'Last 6 months payslips'),
#             ('educational_certificates_collected', 'educational_certificates_file', 'Educational Certificates'),
#             ('previous_offer_letter_collected', 'previous_offer_letter_file', 'Previous Offer Letter'),
#             ('relieving_experience_letters_collected', 'relieving_experience_letters_file', 'Relieving & Experience Letters'),
#             ('appraisal_hike_letters_collected', 'appraisal_hike_letters_file', 'Appraisal/Hike Letters'),
#         ]
        
#         uploaded_docs = []
#         missing_docs = []
        
#         for collected_field, file_field, doc_name in required_docs:
#             is_collected = getattr(employee, collected_field, False)
#             has_file = bool(getattr(employee, file_field, None))
            
#             if is_collected and has_file:
#                 uploaded_docs.append({
#                     'doc_type': doc_name,
#                     'collected': True,
#                     'file_available': True
#                 })
#             else:
#                 missing_docs.append({
#                     'doc_type': doc_name,
#                     'collected': is_collected,
#                     'file_available': has_file
#                 })
        
#         total_required = len(required_docs)
#         total_uploaded = len(uploaded_docs)
#         completion_percentage = (total_uploaded / total_required) * 100 if total_required > 0 else 0
        
#         return Response({
#             'employee_id': employee.id,
#             'employee_name': employee.full_name,
#             'required_documents': {
#                 'uploaded': uploaded_docs,
#                 'missing': missing_docs
#             },
#             'total_required': total_required,
#             'total_uploaded': total_uploaded,
#             'completion_percentage': round(completion_percentage, 1),
#             'is_complete': total_uploaded == total_required,
#             'optional_documents': []  # Add if you have optional documents
#         })
        
#     except Exception as e:
#         return Response(
#             {'error': f'Failed to fetch document status: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def employee_upload_documents(request, employee_id):
#     """Upload documents for an employee"""
#     try:
#         # Try onboarding record; if missing, auto-create from core employee data
#         employee = resolve_or_create_onboarding_employee(employee_id)
#         if not employee:
#             return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
#         files_uploaded = []
        
#         # Document field mapping
#         doc_fields = {
#             'document_Aadhar and PAN Card': 'aadhar_pan_file',
#             'document_Last 6 months payslips': 'payslips_file',
#             'document_Educational Certificates (Degree)': 'educational_certificates_file',
#             'document_Previous Offer Letter': 'previous_offer_letter_file',
#             'document_Relieving & Experience Letters': 'relieving_experience_letters_file',
#             'document_Appraisal/Hike Letters': 'appraisal_hike_letters_file',
#         }
        
#         for form_field, model_field in doc_fields.items():
#             if form_field in request.FILES:
#                 file = request.FILES[form_field]
#                 setattr(employee, model_field, file)
                
#                 # Auto-check corresponding collection field
#                 collection_field = model_field.replace('_file', '_collected')
#                 setattr(employee, collection_field, True)
                
#                 files_uploaded.append({
#                     'field': model_field,
#                     'filename': file.name,
#                     'size': file.size
#                 })
        
#         employee.save()
        
#         return Response({
#             'message': 'Documents uploaded successfully',
#             'files_uploaded': files_uploaded
#         })
        
#     except Exception as e:
#         return Response(
#             {'error': f'Failed to upload documents: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )


# def resolve_or_create_onboarding_employee(employee_id):
#     """
#     Ensure an onboarding.Employee exists for uploads.
#     If missing, try to pull minimal info from the core employees.Employee
#     and create a stub onboarding record.
#     """
#     # Already present?
#     onboarding_emp = Employee.objects.filter(id=employee_id).first()
#     if onboarding_emp:
#         return onboarding_emp

#     # Try to find by email to avoid duplicate creation when another onboarding record exists
#     def _by_email(email_val):
#         if not email_val:
#             return None
#         return Employee.objects.filter(email__iexact=email_val).first()

#     # Try core employee by primary key or by employee_id string
#     core_emp = (
#         CoreEmployee.objects.filter(id=employee_id).select_related('user').first()
#         or CoreEmployee.objects.filter(employee_id=str(employee_id)).select_related('user').first()
#     )
#     if not core_emp:
#         return None

#     user = core_emp.user
#     first_name = (getattr(user, 'first_name', '') or '').strip() or 'Unknown'
#     last_name = (getattr(user, 'last_name', '') or '').strip()
#     email = (getattr(user, 'email', '') or '').strip()
#     phone_number = getattr(user, 'phone_number', '') if hasattr(user, 'phone_number') else ''
#     if not phone_number:
#         phone_number = 'N/A'

#     # Required field safety: provide a fallback email if empty
#     if not email:
#         email = f"no-email-{uuid.uuid4()}@placeholder.local"

#     # If an onboarding record already exists for this email, reuse it
#     existing = _by_email(email)
#     if existing:
#         return existing

#     try:
#         onboarding_emp = Employee.objects.create(
#             first_name=first_name,
#             last_name=last_name,
#             email=email,
#             phone_number=phone_number,
#             employee_type='employee',  # default choice value
#             department=None,
#             position=core_emp.position or '',
#             current_address='',
#             permanent_address='',
#             joining_date=core_emp.hire_date,
#             status='pending'
#         )
#         return onboarding_emp
#     except Exception:
#         # Final safeguard: if concurrent creation caused a unique constraint, fetch again
#         return _by_email(email)

# # Employee Self-Submission API Views
def _decode_onboarding_token(encoded_data: str) -> str:
    token = (encoded_data or '').strip()
    # Allow URL-safe base64 without padding
    token += '=' * (-len(token) % 4)
    return base64.urlsafe_b64decode(token.encode()).decode()

@api_view(['GET'])
@permission_classes([AllowAny])
def validate_onboarding_link(request, encoded_data):
    """Validate onboarding link and return link/employee info"""
    try:
        decoded_data = _decode_onboarding_token(encoded_data)

        if decoded_data.startswith('GENERIC_'):
            timestamp = decoded_data.replace('GENERIC_', '')
            link_created_time = datetime.fromtimestamp(int(timestamp))
            days_old = (datetime.now() - link_created_time).days

            if days_old >= 7:
                return Response({
                    'status': 'expired',
                    'link_info': {
                        'created_at': link_created_time,
                        'days_old': days_old
                    },
                    'employee': None
                })

            return Response({
                'status': 'valid',
                'link_info': {
                    'created_at': link_created_time,
                    'expires_at': link_created_time + timedelta(days=7)
                },
                'employee': None
            })

        employee_id, timestamp = decoded_data.split('_')
        employee = get_object_or_404(Employee.all_objects, id=int(employee_id))

        if employee.is_deleted:
            return Response({
                'status': 'deleted',
                'employee': EmployeeSerializer(employee).data,
                'link_info': None
            })

        if employee.is_self_submitted:
            return Response({
                'status': 'already_submitted',
                'employee': EmployeeSerializer(employee).data,
                'link_info': None
            })

        created_at = datetime.fromtimestamp(int(timestamp))
        return Response({
            'status': 'valid',
            'employee': EmployeeSerializer(employee).data,
            'link_info': {
                'created_at': created_at,
                'expires_at': created_at + timedelta(days=7)
            }
        })
    except Exception:
        return Response({
            'status': 'invalid',
            'employee': None,
            'link_info': None
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def employee_self_submit(request, encoded_data=None):
    """Handle employee self-submission via onboarding form"""
    try:
        employee = None

        if encoded_data:
            try:
                decoded_data = _decode_onboarding_token(encoded_data)
                if decoded_data.startswith('GENERIC_'):
                    timestamp = decoded_data.replace('GENERIC_', '')
                    link_created_time = datetime.fromtimestamp(int(timestamp))
                    days_old = (datetime.now() - link_created_time).days
                    if days_old >= 7:
                        return Response({'error': 'Invalid or expired link'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    employee_id, _timestamp = decoded_data.split('_')
                    employee_obj = get_object_or_404(Employee.all_objects, id=int(employee_id))
                    if employee_obj.is_deleted or employee_obj.is_self_submitted:
                        return Response({'error': 'Invalid or expired link'}, status=status.HTTP_400_BAD_REQUEST)
                    employee = employee_obj
            except Exception:
                return Response({'error': 'Invalid or expired link'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = EmployeeSelfSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        form_data = {
            'first_name': serializer.validated_data['first_name'],
            'last_name': serializer.validated_data['last_name'],
            'email': serializer.validated_data['email'],
            'phone_number': serializer.validated_data['phone_number'],
            'current_address': serializer.validated_data['current_address'],
            'permanent_address': serializer.validated_data['permanent_address'],
        }

        if not employee:
            existing = Employee.all_objects.filter(email=form_data['email']).first()
            if existing:
                if existing.is_deleted:
                    return Response({'error': 'An employee with this email was previously deactivated. Contact HR.'}, status=status.HTTP_400_BAD_REQUEST)
                if existing.is_self_submitted:
                    return Response({'error': 'An employee with this email has already completed onboarding.'}, status=status.HTTP_400_BAD_REQUEST)
                employee = existing

        if employee:
            for field, value in form_data.items():
                setattr(employee, field, value)
        else:
            employee = Employee(**form_data)

        document_fields = [
            'aadhar_pan_file',
            'payslips_file',
            'educational_certificates_file',
            'previous_offer_letter_file',
            'relieving_experience_letters_file',
            'appraisal_hike_letters_file',
        ]
        for field in document_fields:
            file_obj = serializer.validated_data.get(field)
            if file_obj:
                setattr(employee, field, file_obj)
                collection_field = field.replace('_file', '_collected')
                setattr(employee, collection_field, True)

        employee.is_self_submitted = True
        employee.submitted_at = timezone.now()
        employee.save()

        return Response({
            'message': 'Onboarding information submitted successfully',
            'employee_id': employee.id
        })

    except Exception:
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_list(request):
    """List onboarding employees (optionally including deleted) or create a new onboarding employee."""
    if request.method == 'GET':
        status_filter = request.GET.get('status')
        deleted_only = (request.GET.get('deleted_only', 'false') or 'false').lower() == 'true'
        active_only = (request.GET.get('active_only', 'false') or 'false').lower() == 'true'

        if deleted_only:
            qs = Employee.all_objects.filter(is_deleted=True)
        elif active_only:
            qs = Employee.objects.all()
        else:
            qs = Employee.all_objects.all()

        if status_filter and status_filter in ['pending', 'accepted', 'rejected']:
            qs = qs.filter(status=status_filter)

        serializer = EmployeeSerializer(qs, many=True)
        return Response({'results': serializer.data})

    return employee_create(request)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def employee_create(request):
    serializer = EmployeeSerializer(data=request.data)
    if serializer.is_valid():
        employee = serializer.save()
        return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def employee_update(request, employee_id):
    employee = get_object_or_404(Employee.all_objects, id=employee_id)
    serializer = EmployeeSerializer(employee, data=request.data, partial=True)
    if serializer.is_valid():
        employee = serializer.save()
        return Response(EmployeeSerializer(employee).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def employee_soft_delete(request, employee_id):
    employee = get_object_or_404(Employee.all_objects, id=employee_id)
    if employee.is_deleted:
        return Response({'error': 'Employee is already deleted'}, status=status.HTTP_400_BAD_REQUEST)
    employee.soft_delete()
    return Response({'message': 'Employee soft deleted successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def employee_restore(request, employee_id):
    employee = get_object_or_404(Employee.all_objects, id=employee_id)
    if not employee.is_deleted:
        return Response({'error': 'Employee is not deleted'}, status=status.HTTP_400_BAD_REQUEST)
    employee.restore()
    return Response({'message': 'Employee restored successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def employee_update_status(request, employee_id):
    """Update onboarding approval status."""
    employee = get_object_or_404(Employee.all_objects, id=employee_id)
    new_status = request.data.get('status')
    if new_status not in ['pending', 'accepted', 'rejected']:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    employee.status = new_status
    employee.save(update_fields=['status'])
    return Response({'message': f'Status updated to {new_status}'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_documents_status(request, employee_id):
    employee = get_object_or_404(Employee.all_objects, id=employee_id)

    required_docs = [
        ('aadhar_pan_collected', 'aadhar_pan_file', 'Aadhar and PAN Card'),
        ('payslips_collected', 'payslips_file', 'Last 6 months payslips'),
        ('educational_certificates_collected', 'educational_certificates_file', 'Educational Certificates (Degree)'),
        ('previous_offer_letter_collected', 'previous_offer_letter_file', 'Previous Offer Letter'),
        ('relieving_experience_letters_collected', 'relieving_experience_letters_file', 'Relieving & Experience Letters'),
        ('appraisal_hike_letters_collected', 'appraisal_hike_letters_file', 'Appraisal/Hike Letters'),
    ]

    uploaded_docs = []
    missing_docs = []

    for collected_field, file_field, doc_name in required_docs:
        is_collected = bool(getattr(employee, collected_field, False))
        file_obj = getattr(employee, file_field, None)
        has_file = bool(file_obj)

        if is_collected and has_file:
            uploaded_docs.append({'doc_type': doc_name, 'collected': True, 'file_available': True})
        else:
            missing_docs.append({'doc_type': doc_name, 'collected': is_collected, 'file_available': has_file})

    total_required = len(required_docs)
    total_uploaded = len(uploaded_docs)
    completion_percentage = (total_uploaded / total_required) * 100 if total_required else 0

    return Response({
        'employee_id': employee.id,
        'employee_name': employee.full_name,
        'required_documents': {
            'uploaded': uploaded_docs,
            'missing': missing_docs,
        },
        'total_required': total_required,
        'total_uploaded': total_uploaded,
        'completion_percentage': round(completion_percentage, 1),
        'is_complete': total_uploaded == total_required,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def employee_upload_documents(request, employee_id):
    employee = get_object_or_404(Employee.all_objects, id=employee_id)

    allowed_exts = getattr(getattr(request, 'settings', None), 'ALLOWED_UPLOAD_EXTENSIONS', None)
    if not allowed_exts:
        from django.conf import settings as dj_settings
        allowed_exts = getattr(dj_settings, 'ALLOWED_UPLOAD_EXTENSIONS', ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'])
        max_size = getattr(dj_settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', None)
    else:
        max_size = None

    doc_fields = {
        'aadhar_pan_file': 'aadhar_pan_collected',
        'payslips_file': 'payslips_collected',
        'educational_certificates_file': 'educational_certificates_collected',
        'previous_offer_letter_file': 'previous_offer_letter_collected',
        'relieving_experience_letters_file': 'relieving_experience_letters_collected',
        'appraisal_hike_letters_file': 'appraisal_hike_letters_collected',
    }

    files_uploaded = []
    for field, collected_field in doc_fields.items():
        if field not in request.FILES:
            continue

        file_obj = request.FILES[field]
        ext = (file_obj.name.rsplit('.', 1)[-1].lower() if '.' in file_obj.name else '')
        dot_ext = f'.{ext}' if ext else ''
        if dot_ext.lower() not in [e.lower() for e in allowed_exts]:
            return Response({'error': 'Unsupported file type'}, status=status.HTTP_400_BAD_REQUEST)
        if max_size is not None and getattr(file_obj, 'size', 0) > int(max_size):
            return Response({'error': 'File too large'}, status=status.HTTP_400_BAD_REQUEST)

        setattr(employee, field, file_obj)
        setattr(employee, collected_field, True)
        files_uploaded.append({'field': field, 'filename': file_obj.name, 'size': getattr(file_obj, 'size', None)})

    employee.save()
    return Response({'message': 'Documents uploaded successfully', 'files_uploaded': files_uploaded})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_list_documents(request, employee_id):
    employee = get_object_or_404(Employee.all_objects, id=employee_id)

    doc_mappings = [
        ('Aadhar and PAN Card', 'aadhar_pan_file'),
        ('Last 6 months payslips', 'payslips_file'),
        ('Educational Certificates (Degree)', 'educational_certificates_file'),
        ('Previous Offer Letter', 'previous_offer_letter_file'),
        ('Relieving & Experience Letters', 'relieving_experience_letters_file'),
        ('Appraisal/Hike Letters', 'appraisal_hike_letters_file'),
    ]

    documents = []
    for doc_type, field_name in doc_mappings:
        file_field = getattr(employee, field_name, None)
        if not file_field:
            continue
        try:
            url = request.build_absolute_uri(file_field.url)
        except Exception:
            url = None
        documents.append({
            'doc_type': doc_type,
            'field': field_name,
            'name': getattr(file_field, 'name', None),
            'url': url,
        })

    return Response({
        'employee_id': employee.id,
        'employee_name': employee.full_name,
        'total_documents': len(documents),
        'documents': documents,
    })


# # Offboarding API Views  
# @api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])
# def offboarding_list(request):
#     """Get list of offboardings or create new offboarding"""
#     if request.method == 'GET':
#         try:
#             offboardings = Offboarding.objects.select_related('employee').all()
#             serializer = OffboardingSerializer(offboardings, many=True)
#             return Response({'results': serializer.data})
#         except Exception as e:
#             return Response(
#                 {'error': f'Failed to fetch offboardings: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
    
#     elif request.method == 'POST':
#         return offboarding_create(request)


# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def offboarding_create(request):
#     """Create a new offboarding record"""
#     try:
#         # Prevent duplicate offboarding for the same employee
#         employee_id = request.data.get('employee')
#         if employee_id is not None:
#             try:
#                 emp_id_int = int(employee_id)
#             except (TypeError, ValueError):
#                 emp_id_int = employee_id
#             if Offboarding.objects.filter(employee_id=emp_id_int).exists():
#                 return Response(
#                     {'error': 'This employee already has an offboarding record'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#         serializer = OffboardingSerializer(data=request.data)
#         if serializer.is_valid():
#             offboarding = serializer.save()
#             return Response(OffboardingSerializer(offboarding).data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
#     except Exception as e:
#         return Response(
#             {'error': f'Failed to create offboarding: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

# @api_view(['DELETE'])
# @permission_classes([IsAuthenticated])
# def offboarding_delete(request, offboarding_id):
#     """Delete an offboarding record"""
#     try:
#         offboarding = get_object_or_404(Offboarding, id=offboarding_id)
#         offboarding.delete()
#         return Response({'message': 'Offboarding deleted successfully'})
#     except Exception as e:
#         return Response(
#             {'error': f'Failed to delete offboarding: {str(e)}'}, 
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )

# # Template-based views for employee self-onboarding
# def employee_onboarding_form(request, encoded_data=None):
#     """View for employees to submit their onboarding information using timestamped link"""
    
#     employee = None
#     link_created_time = None
#     is_expired = False
#     is_generic_link = False
    
#     # If encoded_data is provided, validate it
#     if encoded_data:
#         try:
#             # Decode the data
#             decoded_data = base64.urlsafe_b64decode(encoded_data.encode()).decode()
            
#             # Check if it's a generic link or specific employee link
#             if decoded_data.startswith('GENERIC_'):
#                 # Generic link format: GENERIC_timestamp
#                 is_generic_link = True
#                 timestamp = decoded_data.replace('GENERIC_', '')
#                 link_created_time = datetime.fromtimestamp(int(timestamp))
#             else:
#                 # Specific employee link format: employee_id_timestamp
#                 try:
#                     employee_id, timestamp = decoded_data.split('_')
#                     employee_id = int(employee_id)
#                 except (ValueError, TypeError):
#                     raise ValueError("Invalid link format")
                
#                 # Try to get the employee, checking soft-deleted status
#                 try:
#                     employee = Employee.objects.get(id=employee_id)
#                 except Employee.DoesNotExist:
#                     # Check if employee was soft-deleted
#                     try:
#                         deleted_employee = Employee.all_objects.get(id=employee_id)
#                         if deleted_employee.is_deleted:
#                             messages.error(request, 
#                                 f'This employee record has been deactivated by HR. Please contact HR for assistance.'
#                             )
#                             return render(request, 'onboarding/link_invalid.html', {
#                                 'employee': deleted_employee,
#                                 'reason': 'deleted'
#                             })
#                     except Employee.DoesNotExist:
#                         pass
                    
#                     # Employee doesn't exist at all
#                     messages.error(request, 'Employee record not found. Please contact HR for assistance.')
#                     return render(request, 'onboarding/link_invalid.html', {'reason': 'not_found'})
                
#                 link_created_time = datetime.fromtimestamp(int(timestamp))
                
#                 # Additional validation for soft-deleted employee
#                 if employee.is_deleted:
#                     messages.error(request, 
#                         f'This employee record has been deactivated by HR. Please contact HR for assistance.'
#                     )
#                     return render(request, 'onboarding/link_invalid.html', {
#                         'employee': employee,
#                         'reason': 'deleted'
#                     })
                
#                 # Check if employee already submitted
#                 if employee.is_self_submitted:
#                     messages.info(request, 
#                         f'This employee has already completed onboarding on {employee.submitted_at.strftime("%Y-%m-%d at %H:%M")}. '
#                         f'If you need to make changes, please contact HR.'
#                     )
#                     return render(request, 'onboarding/link_invalid.html', {
#                         'employee': employee,
#                         'reason': 'already_submitted'
#                     })
            
#             # Check if link is older than 7 days (for both generic and specific links)
#             if link_created_time:
#                 days_old = (datetime.now() - link_created_time).days
                
#                 if days_old >= 7:
#                     is_expired = True
#                     messages.error(request, 
#                         f'This onboarding link has expired. Links are valid for 7 days only. '
#                         f'This link was created on {link_created_time.strftime("%Y-%m-%d at %H:%M")}. '
#                         f'Please contact HR for a new link.'
#                     )
#                     return render(request, 'onboarding/link_invalid.html', {
#                         'employee': employee,
#                         'link_created_time': link_created_time,
#                         'is_expired': True,
#                         'days_old': days_old,
#                         'is_generic_link': is_generic_link,
#                         'reason': 'expired'
#                     })
                
#         except (ValueError, TypeError, Exception) as e:
#             print(f"Link validation error: {str(e)}")  # For debugging
#             messages.error(request, 'Invalid onboarding link. Please contact HR for assistance.')
#             return render(request, 'onboarding/link_invalid.html', {'reason': 'invalid'})
    
#     if request.method == 'POST':
#         form = EmployeeSelfOnboardingForm(request.POST, request.FILES)
        
#         if form.is_valid():
#             try:
#                 if employee:
#                     # Double-check employee status before processing
#                     if employee.is_deleted:
#                         messages.error(request, 'This employee record has been deactivated. Please contact HR for assistance.')
#                         return render(request, 'onboarding/link_invalid.html', {
#                             'employee': employee,
#                             'reason': 'deleted'
#                         })
                    
#                     if employee.is_self_submitted:
#                         messages.error(request, 'This employee has already completed onboarding. Please contact HR for assistance.')
#                         return render(request, 'onboarding/link_invalid.html', {
#                             'employee': employee,
#                             'reason': 'already_submitted'
#                         })
                    
#                     # Update existing employee record (specific employee link)
#                     for field in form.cleaned_data:
#                         if field not in ['aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
#                                        'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file']:
#                             setattr(employee, field, form.cleaned_data[field])
                    
#                     # Handle file uploads
#                     for field_name in ['aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
#                                      'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file']:
#                         if form.cleaned_data[field_name]:
#                             setattr(employee, field_name, form.cleaned_data[field_name])
#                             # Auto-check corresponding collection field
#                             collection_field = field_name.replace('_file', '_collected')
#                             setattr(employee, collection_field, True)
                    
#                     # Mark onboarding as complete
#                     employee.is_self_submitted = True
#                     employee.submitted_at = timezone.now()
#                     employee.save()
                    
#                 else:
#                     # Create new employee record (generic link or direct access)
#                     # Check if email already exists (including soft-deleted)
#                     email = form.cleaned_data['email']
#                     existing_employee = Employee.all_objects.filter(email=email).first()
                    
#                     if existing_employee:
#                         if existing_employee.is_deleted:
#                             messages.error(request, 
#                                 'An employee record with this email was previously created but has been deactivated. '
#                                 'Please contact HR for assistance.'
#                             )
#                             return render(request, 'onboarding/employee_form.html', {
#                                 'form': form,
#                                 'error_type': 'email_deleted'
#                             })
#                         elif existing_employee.is_self_submitted:
#                             messages.error(request, 
#                                 'An employee with this email has already completed onboarding. '
#                                 'Please contact HR if you need assistance.'
#                             )
#                             return render(request, 'onboarding/employee_form.html', {
#                                 'form': form,
#                                 'error_type': 'email_submitted'
#                             })
#                         else:
#                             messages.error(request, 
#                                 'An employee record with this email already exists. '
#                                 'Please contact HR for assistance.'
#                             )
#                             return render(request, 'onboarding/employee_form.html', {
#                                 'form': form,
#                                 'error_type': 'email_exists'
#                             })
                    
#                     employee = form.save()
                
#                 # Send confirmation email to employee
#                 try:
#                     send_confirmation_email(employee)
#                 except Exception as e:
#                     print(f"Failed to send confirmation email: {str(e)}")
#                     # Don't fail the submission if email fails
                
#                 # Send notification to HR team
#                 try:
#                     send_hr_notification(employee, is_generic_link, encoded_data, link_created_time)
#                 except Exception as e:
#                     print(f"Failed to send HR notification email: {str(e)}")
#                     # Don't fail the submission if email fails
                
#                 messages.success(
#                     request, 
#                     f'Thank you {employee.full_name}! Your onboarding information has been submitted successfully. '
#                     'You will receive a confirmation email shortly.'
#                 )
#                 return redirect('onboarding:employee_onboarding_success')
                
#             except Exception as e:
#                 print(f"Submission error: {str(e)}")  # For debugging
#                 messages.error(request, f'An error occurred while submitting your information. Please try again or contact HR for assistance.')
#         else:
#             messages.error(request, 'Please correct the errors below and try again.')
#     else:
#         if employee:
#             # Double-check employee status before showing form
#             if employee.is_deleted:
#                 messages.error(request, 'This employee record has been deactivated. Please contact HR for assistance.')
#                 return render(request, 'onboarding/link_invalid.html', {
#                     'employee': employee,
#                     'reason': 'deleted'
#                 })
            
#             # Pre-fill form with existing employee data (specific employee link)
#             initial_data = {
#                 'first_name': employee.first_name,
#                 'last_name': employee.last_name,
#                 'email': employee.email,
#                 'phone_number': employee.phone_number,
#                 'current_address': employee.current_address,
#                 'permanent_address': employee.permanent_address,
#             }
#             form = EmployeeSelfOnboardingForm(initial=initial_data)
#         else:
#             # Empty form (generic link or direct access)
#             form = EmployeeSelfOnboardingForm()
    
#     # Calculate expiry info for display
#     expiry_info = None
#     if link_created_time and not is_expired:
#         expiry_date = link_created_time + timedelta(days=7)
#         remaining_time = expiry_date - datetime.now()
#         days_remaining = remaining_time.days
#         hours_remaining = remaining_time.seconds // 3600
        
#         if days_remaining > 0:
#             time_remaining = f"{days_remaining} day(s), {hours_remaining} hour(s)"
#         else:
#             time_remaining = f"{hours_remaining} hour(s)"
            
#         expiry_info = {
#             'expires_at': expiry_date,
#             'time_remaining': time_remaining,
#             'created_at': link_created_time
#         }
    
#     context = {
#         'form': form,
#         'employee': employee,
#         'expiry_info': expiry_info,
#         'is_generic_link': is_generic_link,
#     }
    
#     return render(request, 'onboarding/employee_form.html', context)

# def send_confirmation_email(employee):
#     """Send confirmation email to employee"""
#     message = f"""Hi {employee.full_name},

# Thank you for submitting your onboarding information!

# Your details have been successfully received and will be reviewed by our HR team. We'll contact you soon regarding the next steps.

# Submitted Information:
# - Name: {employee.full_name}
# - Email: {employee.email}
# - Phone: {employee.phone_number}
# - Current Address: {employee.current_address or 'Not specified'}
# - Permanent Address: {employee.permanent_address or 'Not specified'}

# All required documents have been uploaded successfully.

# Best Regards,
# HR Team - Techoptima Pvt Ltd"""

#     email = EmailMessage(
#         subject=f"Onboarding Information Received - {employee.full_name}",
#         body=message,
#         to=[employee.email],
#     )
#     email.content_subtype = "plain"
#     email.send()

# def send_hr_notification(employee, is_generic_link, encoded_data, link_created_time):
#     """Send notification email to HR team"""
#     if is_generic_link:
#         submission_method = "via generic onboarding link"
#     elif encoded_data and not is_generic_link:
#         submission_method = "via specific employee onboarding link"
#     else:
#         submission_method = "direct submission"
        
#     hr_message = f"""Hi HR Team,

# A new employee has submitted their onboarding information through the self-service portal ({submission_method}).

# Employee Details:
# - Name: {employee.full_name}
# - Email: {employee.email}
# - Phone: {employee.phone_number}
# - Submission Date: {employee.submitted_at.strftime('%Y-%m-%d %H:%M')}

# {f'Link Created: {link_created_time.strftime("%Y-%m-%d %H:%M")}' if link_created_time else 'Direct submission (no timestamped link used)'}

# All required documents have been uploaded. Please review the submission in the HR management system.

# Best Regards,
# System - Techoptima Pvt Ltd"""

#     hr_email = EmailMessage(
#         subject=f"New Employee Self-Submission - {employee.full_name}",
#         body=hr_message,
#         to=["hr@techoptima.com"],  # Replace with actual HR email
#     )
#     hr_email.content_subtype = "plain"
#     hr_email.send()

# def employee_onboarding_success(request):
#     """Success page after employee submits onboarding form"""
#     return render(request, 'onboarding/success.html')
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def offboarding_list(request):
    """Get list of offboardings or create new offboarding"""
    if request.method == 'GET':
        # Check permissions
        if not can_manage_onboarding(request.user):
            return Response(
                {'error': 'Permission denied. Only HR and Executives can view offboarding records.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            offboardings = Offboarding.objects.select_related('employee').all()
            serializer = OffboardingSerializer(offboardings, many=True)
            return Response({'results': serializer.data})
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch offboardings: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    elif request.method == 'POST':
        return offboarding_create(request)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def offboarding_create(request):
    """Create a new offboarding record"""
    # Check permissions
    if not can_create_onboarding(request.user):
        return Response(
            {'error': 'Permission denied. Only HR and Executives can create offboarding records.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Prevent duplicate offboarding for the same employee
        employee_id = request.data.get('employee')
        if employee_id is not None:
            try:
                emp_id_int = int(employee_id)
            except (TypeError, ValueError):
                emp_id_int = employee_id
            if Offboarding.objects.filter(employee_id=emp_id_int).exists():
                return Response(
                    {'error': 'This employee already has an offboarding record'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = OffboardingSerializer(data=request.data)
        if serializer.is_valid():
            offboarding = serializer.save()
            return Response(OffboardingSerializer(offboarding).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': f'Failed to create offboarding: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def offboarding_delete(request, offboarding_id):
    """Delete an offboarding record"""
    # Check permissions
    if not can_delete_onboarding(request.user):
        return Response(
            {'error': 'Permission denied. Only HR and Executives can delete offboarding records.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        offboarding = get_object_or_404(Offboarding, id=offboarding_id)
        offboarding.delete()
        return Response({'message': 'Offboarding deleted successfully'})
    except Exception as e:
        return Response(
            {'error': f'Failed to delete offboarding: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Template-based views for employee self-onboarding (remain largely the same)
def employee_onboarding_form(request, encoded_data=None):
    """View for employees to submit their onboarding information using timestamped link"""
    
    employee = None
    link_created_time = None
    is_expired = False
    is_generic_link = False
    
    # If encoded_data is provided, validate it
    if encoded_data:
        try:
            # Decode the data
            decoded_data = base64.urlsafe_b64decode(encoded_data.encode()).decode()
            
            # Check if it's a generic link or specific employee link
            if decoded_data.startswith('GENERIC_'):
                is_generic_link = True
                timestamp = decoded_data.replace('GENERIC_', '')
                link_created_time = datetime.fromtimestamp(int(timestamp))
            else:
                try:
                    employee_id, timestamp = decoded_data.split('_')
                    employee_id = int(employee_id)
                except (ValueError, TypeError):
                    raise ValueError("Invalid link format")
                
                try:
                    employee = Employee.objects.get(id=employee_id)
                except Employee.DoesNotExist:
                    try:
                        deleted_employee = Employee.all_objects.get(id=employee_id)
                        if deleted_employee.is_deleted:
                            messages.error(request, 
                                f'This employee record has been deactivated by HR. Please contact HR for assistance.'
                            )
                            return render(request, 'onboarding/link_invalid.html', {
                                'employee': deleted_employee,
                                'reason': 'deleted'
                            })
                    except Employee.DoesNotExist:
                        pass
                    
                    messages.error(request, 'Employee record not found. Please contact HR for assistance.')
                    return render(request, 'onboarding/link_invalid.html', {'reason': 'not_found'})
                
                link_created_time = datetime.fromtimestamp(int(timestamp))
                
                if employee.is_deleted:
                    messages.error(request, 
                        f'This employee record has been deactivated by HR. Please contact HR for assistance.'
                    )
                    return render(request, 'onboarding/link_invalid.html', {
                        'employee': employee,
                        'reason': 'deleted'
                    })
                
                if employee.is_self_submitted:
                    messages.info(request, 
                        f'This employee has already completed onboarding on {employee.submitted_at.strftime("%Y-%m-%d at %H:%M")}. '
                        f'If you need to make changes, please contact HR.'
                    )
                    return render(request, 'onboarding/link_invalid.html', {
                        'employee': employee,
                        'reason': 'already_submitted'
                    })
            
            # Check if link is older than 7 days
            if link_created_time:
                days_old = (datetime.now() - link_created_time).days
                
                if days_old >= 7:
                    is_expired = True
                    messages.error(request, 
                        f'This onboarding link has expired. Links are valid for 7 days only. '
                        f'This link was created on {link_created_time.strftime("%Y-%m-%d at %H:%M")}. '
                        f'Please contact HR for a new link.'
                    )
                    return render(request, 'onboarding/link_invalid.html', {
                        'employee': employee,
                        'link_created_time': link_created_time,
                        'is_expired': True,
                        'days_old': days_old,
                        'is_generic_link': is_generic_link,
                        'reason': 'expired'
                    })
                
        except (ValueError, TypeError, Exception) as e:
            print(f"Link validation error: {str(e)}")
            messages.error(request, 'Invalid onboarding link. Please contact HR for assistance.')
            return render(request, 'onboarding/link_invalid.html', {'reason': 'invalid'})
    
    if request.method == 'POST':
        form = EmployeeSelfOnboardingForm(request.POST, request.FILES)
        
        if form.is_valid():
            try:
                if employee:
                    if employee.is_deleted:
                        messages.error(request, 'This employee record has been deactivated. Please contact HR for assistance.')
                        return render(request, 'onboarding/link_invalid.html', {
                            'employee': employee,
                            'reason': 'deleted'
                        })
                    
                    if employee.is_self_submitted:
                        messages.error(request, 'This employee has already completed onboarding. Please contact HR for assistance.')
                        return render(request, 'onboarding/link_invalid.html', {
                            'employee': employee,
                            'reason': 'already_submitted'
                        })
                    
                    # Update existing employee record
                    for field in form.cleaned_data:
                        if field not in ['aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
                                       'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file']:
                            setattr(employee, field, form.cleaned_data[field])
                    
                    # Handle file uploads
                    for field_name in ['aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
                                     'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file']:
                        if form.cleaned_data[field_name]:
                            setattr(employee, field_name, form.cleaned_data[field_name])
                            collection_field = field_name.replace('_file', '_collected')
                            setattr(employee, collection_field, True)
                    
                    employee.is_self_submitted = True
                    employee.submitted_at = timezone.now()
                    employee.save()
                    
                else:
                    # Create new employee record
                    email = form.cleaned_data['email']
                    existing_employee = Employee.all_objects.filter(email=email).first()
                    
                    if existing_employee:
                        if existing_employee.is_deleted:
                            messages.error(request, 
                                'An employee record with this email was previously created but has been deactivated. '
                                'Please contact HR for assistance.'
                            )
                            return render(request, 'onboarding/employee_form.html', {
                                'form': form,
                                'error_type': 'email_deleted'
                            })
                        elif existing_employee.is_self_submitted:
                            messages.error(request, 
                                'An employee with this email has already completed onboarding. '
                                'Please contact HR if you need assistance.'
                            )
                            return render(request, 'onboarding/employee_form.html', {
                                'form': form,
                                'error_type': 'email_submitted'
                            })
                        else:
                            messages.error(request, 
                                'An employee record with this email already exists. '
                                'Please contact HR for assistance.'
                            )
                            return render(request, 'onboarding/employee_form.html', {
                                'form': form,
                                'error_type': 'email_exists'
                            })
                    
                    employee = form.save()
                
                # Send confirmation email
                try:
                    send_confirmation_email(employee)
                except Exception as e:
                    print(f"Failed to send confirmation email: {str(e)}")
                
                # Send HR notification
                try:
                    send_hr_notification(employee, is_generic_link, encoded_data, link_created_time)
                except Exception as e:
                    print(f"Failed to send HR notification email: {str(e)}")
                
                messages.success(
                    request, 
                    f'Thank you {employee.full_name}! Your onboarding information has been submitted successfully. '
                    'You will receive a confirmation email shortly.'
                )
                return redirect('onboarding:employee_onboarding_success')
                
            except Exception as e:
                print(f"Submission error: {str(e)}")
                messages.error(request, f'An error occurred while submitting your information. Please try again or contact HR for assistance.')
        else:
            messages.error(request, 'Please correct the errors below and try again.')
    else:
        if employee:
            if employee.is_deleted:
                messages.error(request, 'This employee record has been deactivated. Please contact HR for assistance.')
                return render(request, 'onboarding/link_invalid.html', {
                    'employee': employee,
                    'reason': 'deleted'
                })
            
            initial_data = {
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'email': employee.email,
                'phone_number': employee.phone_number,
                'current_address': employee.current_address,
                'permanent_address': employee.permanent_address,
            }
            form = EmployeeSelfOnboardingForm(initial=initial_data)
        else:
            form = EmployeeSelfOnboardingForm()
    
    # Calculate expiry info
    expiry_info = None
    if link_created_time and not is_expired:
        expiry_date = link_created_time + timedelta(days=7)
        remaining_time = expiry_date - datetime.now()
        days_remaining = remaining_time.days
        hours_remaining = remaining_time.seconds // 3600
        
        if days_remaining > 0:
            time_remaining = f"{days_remaining} day(s), {hours_remaining} hour(s)"
        else:
            time_remaining = f"{hours_remaining} hour(s)"
            
        expiry_info = {
            'expires_at': expiry_date,
            'time_remaining': time_remaining,
            'created_at': link_created_time
        }
    
    context = {
        'form': form,
        'employee': employee,
        'expiry_info': expiry_info,
        'is_generic_link': is_generic_link,
    }
    
    return render(request, 'onboarding/employee_form.html', context)


def send_confirmation_email(employee):
    """Send confirmation email to employee"""
    message = f"""Hi {employee.full_name},

Thank you for submitting your onboarding information!

Your details have been successfully received and will be reviewed by our HR team. We'll contact you soon regarding the next steps.

Submitted Information:
- Name: {employee.full_name}
- Email: {employee.email}
- Phone: {employee.phone_number}
- Current Address: {employee.current_address or 'Not specified'}
- Permanent Address: {employee.permanent_address or 'Not specified'}

All required documents have been uploaded successfully.

Best Regards,
HR Team - Techoptima Pvt Ltd"""

    email = EmailMessage(
        subject=f"Onboarding Information Received - {employee.full_name}",
        body=message,
        to=[employee.email],
    )
    email.content_subtype = "plain"
    email.send()


def send_hr_notification(employee, is_generic_link, encoded_data, link_created_time):
    """Send notification email to HR team"""
    if is_generic_link:
        submission_method = "via generic onboarding link"
    elif encoded_data and not is_generic_link:
        submission_method = "via specific employee onboarding link"
    else:
        submission_method = "direct submission"
        
    hr_message = f"""Hi HR Team,

A new employee has submitted their onboarding information through the self-service portal ({submission_method}).

Employee Details:
- Name: {employee.full_name}
- Email: {employee.email}
- Phone: {employee.phone_number}
- Submission Date: {employee.submitted_at.strftime('%Y-%m-%d %H:%M')}

{f'Link Created: {link_created_time.strftime("%Y-%m-%d %H:%M")}' if link_created_time else 'Direct submission (no timestamped link used)'}

All required documents have been uploaded. Please review the submission in the HR management system.

Best Regards,
System - Techoptima Pvt Ltd"""

    hr_email = EmailMessage(
        subject=f"New Employee Self-Submission - {employee.full_name}",
        body=hr_message,
        to=["hr@techoptima.com"],  # Replace with actual HR email
    )
    hr_email.content_subtype = "plain"
    hr_email.send()


def employee_onboarding_success(request):
    """Success page after employee submits onboarding form"""
    return render(request, 'onboarding/success.html')