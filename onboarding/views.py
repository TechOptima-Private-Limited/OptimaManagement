# # from django.shortcuts import render

# # # Create your views here.
# # from django.shortcuts import render, redirect
# # from django.contrib import messages
# # from django.core.mail import EmailMessage
# # from django.conf import settings
# # from django.utils import timezone
# # from .forms import EmployeeSelfOnboardingForm
# # from .models import Employee

# # def employee_onboarding_form(request):
# #     """View for employees to submit their onboarding information"""
    
# #     if request.method == 'POST':
# #         form = EmployeeSelfOnboardingForm(request.POST, request.FILES)
        
# #         if form.is_valid():
# #             try:
# #                 employee = form.save()
                
# #                 # Send confirmation email to employee
# #                 try:
# #                     message = f"""Hi {employee.full_name},

# # Thank you for submitting your onboarding information!

# # Your details have been successfully received and will be reviewed by our HR team. We'll contact you soon regarding the next steps.

# # Submitted Information:
# # - Name: {employee.full_name}
# # - Email: {employee.email}
# # - Phone: {employee.phone_number}
# # - Department: {employee.get_department_display()}
# # - Position: {employee.get_position_display()}
# # - Employee Type: {employee.get_employee_type_display()}
# # - Joining Date: {employee.joining_date or 'Not specified'}

# # All required documents have been uploaded successfully.

# # Best Regards,
# # HR Team - Techoptima Pvt Ltd"""

# #                     email = EmailMessage(
# #                         subject=f"Onboarding Information Received - {employee.full_name}",
# #                         body=message,
# #                         to=[employee.email],
# #                     )
# #                     email.content_subtype = "plain"
# #                     email.send()
                    
# #                 except Exception as e:
# #                     print(f"Failed to send confirmation email: {str(e)}")
                
# #                 # Send notification to HR team
# #                 try:
# #                     hr_message = f"""Hi HR Team,

# # A new employee has submitted their onboarding information through the self-service portal.

# # Employee Details:
# # - Name: {employee.full_name}
# # - Email: {employee.email}
# # - Phone: {employee.phone_number}
# # - Department: {employee.get_department_display()}
# # - Position: {employee.get_position_display()}
# # - Employee Type: {employee.get_employee_type_display()}
# # - Joining Date: {employee.joining_date or 'Not specified'}
# # - Submission Date: {employee.submitted_at.strftime('%Y-%m-%d %H:%M')}


# # All required documents have been uploaded. Please review the submission in the admin panel.


# # Best Regards,
# # System - Techoptima Pvt Ltd"""

# #                     hr_email = EmailMessage(
# #                         subject=f"New Employee Self-Submission - {employee.full_name}",
# #                         body=hr_message,
# #                         to=["thotaganesh590@gmail.com"],  # Replace with actual HR email
# #                     )
# #                     hr_email.content_subtype = "plain"
# #                     hr_email.send()
                    
# #                 except Exception as e:
# #                     print(f"Failed to send HR notification email: {str(e)}")
                
# #                 messages.success(
# #                     request, 
# #                     f'Thank you {employee.full_name}! Your onboarding information has been submitted successfully. '
# #                     'You will receive a confirmation email shortly.'
# #                 )
# #                 return redirect('onboarding:employee_onboarding_success')
                
# #             except Exception as e:
# #                 messages.error(request, f'An error occurred while submitting your information: {str(e)}')
# #         else:
# #             messages.error(request, 'Please correct the errors below and try again.')
# #     else:
# #         form = EmployeeSelfOnboardingForm()
    
# #     return render(request, 'onboarding/employee_form.html', {'form': form})

# # def employee_onboarding_success(request):
# #     """Success page after employee submits onboarding form"""
# #     return render(request, 'onboarding/success.html')




# # from django.shortcuts import render, redirect, get_object_or_404
# # from django.contrib import messages
# # from django.core.mail import EmailMessage
# # from django.conf import settings
# # from django.utils import timezone
# # from django.http import Http404
# # from .forms import EmployeeSelfOnboardingForm
# # from .models import Employee
# # import base64
# # import time
# # from datetime import datetime, timedelta

# # def employee_onboarding_form(request, encoded_data=None):
# #     """View for employees to submit their onboarding information using timestamped link"""
    
# #     employee = None
# #     link_created_time = None
# #     is_expired = False
# #     is_generic_link = False
    
# #     # If encoded_data is provided, validate it
# #     if encoded_data:
# #         try:
# #             # Decode the data
# #             decoded_data = base64.urlsafe_b64decode(encoded_data.encode()).decode()
            
# #             # Check if it's a generic link or specific employee link
# #             if decoded_data.startswith('GENERIC_'):
# #                 # Generic link format: GENERIC_timestamp
# #                 is_generic_link = True
# #                 timestamp = decoded_data.replace('GENERIC_', '')
# #                 link_created_time = datetime.fromtimestamp(int(timestamp))
# #             else:
# #                 # Specific employee link format: employee_id_timestamp
# #                 employee_id, timestamp = decoded_data.split('_')
# #                 employee = get_object_or_404(Employee, id=int(employee_id))
# #                 link_created_time = datetime.fromtimestamp(int(timestamp))
                
# #                 # Check if employee already submitted
# #                 if employee.is_self_submitted:
# #                     messages.error(request, 
# #                         f'This employee has already completed onboarding on {employee.submitted_at.strftime("%Y-%m-%d at %H:%M")}. '
# #                         f'Please contact HR if you need assistance.'
# #                     )
# #                     return render(request, 'onboarding/link_invalid.html', {'employee': employee})
            
# #             # Check if link is older than 7 days (for both generic and specific links)
# #             days_old = (datetime.now() - link_created_time).days
            
# #             if days_old >= 7:
# #                 is_expired = True
# #                 messages.error(request, 
# #                     f'This onboarding link has expired. Links are valid for 7 days only. '
# #                     f'This link was created on {link_created_time.strftime("%Y-%m-%d at %H:%M")}. '
# #                     f'Please contact HR for a new link.'
# #                 )
# #                 return render(request, 'onboarding/link_invalid.html', {
# #                     'employee': employee,
# #                     'link_created_time': link_created_time,
# #                     'is_expired': True,
# #                     'days_old': days_old,
# #                     'is_generic_link': is_generic_link
# #                 })
                
# #         except (ValueError, Employee.DoesNotExist, Exception) as e:
# #             messages.error(request, 'Invalid onboarding link. Please contact HR for assistance.')
# #             return render(request, 'onboarding/link_invalid.html')
    
# #     if request.method == 'POST':
# #         form = EmployeeSelfOnboardingForm(request.POST, request.FILES)
        
# #         if form.is_valid():
# #             try:
# #                 if employee:
# #                     # Update existing employee record (specific employee link)
# #                     for field in form.cleaned_data:
# #                         if field not in ['aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
# #                                        'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file']:
# #                             setattr(employee, field, form.cleaned_data[field])
                    
# #                     # Handle file uploads
# #                     for field_name in ['aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
# #                                      'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file']:
# #                         if form.cleaned_data[field_name]:
# #                             setattr(employee, field_name, form.cleaned_data[field_name])
# #                             # Auto-check corresponding collection field
# #                             collection_field = field_name.replace('_file', '_collected')
# #                             setattr(employee, collection_field, True)
                    
# #                     # Mark onboarding as complete
# #                     employee.is_self_submitted = True
# #                     employee.submitted_at = timezone.now()
# #                     employee.save()
                    
# #                 else:
# #                     # Create new employee record (generic link or direct access)
# #                     employee = form.save()
                
# #                 # Send confirmation email to employee
# #                 try:
# #                     message = f"""Hi {employee.full_name},

# # Thank you for submitting your onboarding information!

# # Your details have been successfully received and will be reviewed by our HR team. We'll contact you soon regarding the next steps.

# # Submitted Information:
# # - Name: {employee.full_name}
# # - Email: {employee.email}
# # - Phone: {employee.phone_number}
# # - Department: {employee.get_department_display()}
# # - Position: {employee.get_position_display()}
# # - Employee Type: {employee.get_employee_type_display()}
# # - Joining Date: {employee.joining_date or 'Not specified'}

# # All required documents have been uploaded successfully.

# # Best Regards,
# # HR Team - Techoptima Pvt Ltd"""

# #                     email = EmailMessage(
# #                         subject=f"Onboarding Information Received - {employee.full_name}",
# #                         body=message,
# #                         to=[employee.email],
# #                     )
# #                     email.content_subtype = "plain"
# #                     email.send()
                    
# #                 except Exception as e:
# #                     print(f"Failed to send confirmation email: {str(e)}")
                
# #                 # Send notification to HR team
# #                 try:
# #                     if is_generic_link:
# #                         submission_method = "via generic onboarding link"
# #                     elif encoded_data and not is_generic_link:
# #                         submission_method = "via specific employee onboarding link"
# #                     else:
# #                         submission_method = "direct submission"
                        
# #                     hr_message = f"""Hi HR Team,

# # A new employee has submitted their onboarding information through the self-service portal ({submission_method}).

# # Employee Details:
# # - Name: {employee.full_name}
# # - Email: {employee.email}
# # - Phone: {employee.phone_number}
# # - Department: {employee.get_department_display()}
# # - Position: {employee.get_position_display()}
# # - Employee Type: {employee.get_employee_type_display()}
# # - Joining Date: {employee.joining_date or 'Not specified'}
# # - Submission Date: {employee.submitted_at.strftime('%Y-%m-%d %H:%M')}

# # {f'Link Created: {link_created_time.strftime("%Y-%m-%d %H:%M")}' if link_created_time else 'Direct submission (no timestamped link used)'}

# # All required documents have been uploaded. Please review the submission in the admin panel.

# # Admin Panel Link: [Your admin panel URL]/admin/onboarding/employee/{employee.id}/change/

# # Best Regards,
# # System - Techoptima Pvt Ltd"""

# #                     hr_email = EmailMessage(
# #                         subject=f"New Employee Self-Submission - {employee.full_name}",
# #                         body=hr_message,
# #                         to=["hr@techoptima.com"],  # Replace with actual HR email
# #                     )
# #                     hr_email.content_subtype = "plain"
# #                     hr_email.send()
                    
# #                 except Exception as e:
# #                     print(f"Failed to send HR notification email: {str(e)}")
                
# #                 messages.success(
# #                     request, 
# #                     f'Thank you {employee.full_name}! Your onboarding information has been submitted successfully. '
# #                     'You will receive a confirmation email shortly.'
# #                 )
# #                 return redirect('onboarding:employee_onboarding_success')
                
# #             except Exception as e:
# #                 messages.error(request, f'An error occurred while submitting your information: {str(e)}')
# #         else:
# #             messages.error(request, 'Please correct the errors below and try again.')
# #     else:
# #         if employee:
# #             # Pre-fill form with existing employee data (specific employee link)
# #             initial_data = {
# #                 'first_name': employee.first_name,
# #                 'last_name': employee.last_name,
# #                 'email': employee.email,
# #                 'phone_number': employee.phone_number,
# #                 'employee_type': employee.employee_type,
# #                 'department': employee.department,
# #                 'position': employee.position,
# #                 'address': employee.address,
# #                 'joining_date': employee.joining_date,
# #             }
# #             form = EmployeeSelfOnboardingForm(initial=initial_data)
# #         else:
# #             # Empty form (generic link or direct access)
# #             form = EmployeeSelfOnboardingForm()
    
# #     # Calculate expiry info for display
# #     expiry_info = None
# #     if link_created_time and not is_expired:
# #         expiry_date = link_created_time + timedelta(days=7)
# #         remaining_time = expiry_date - datetime.now()
# #         days_remaining = remaining_time.days
# #         hours_remaining = remaining_time.seconds // 3600
        
# #         if days_remaining > 0:
# #             time_remaining = f"{days_remaining} day(s), {hours_remaining} hour(s)"
# #         else:
# #             time_remaining = f"{hours_remaining} hour(s)"
            
# #         expiry_info = {
# #             'expires_at': expiry_date,
# #             'time_remaining': time_remaining,
# #             'created_at': link_created_time
# #         }
    
# #     context = {
# #         'form': form,
# #         'employee': employee,
# #         'expiry_info': expiry_info,
# #         'is_generic_link': is_generic_link,
# #     }
    
# #     return render(request, 'onboarding/employee_form.html', context)

# # def employee_onboarding_success(request):
# #     """Success page after employee submits onboarding form"""
# #     return render(request, 'onboarding/success.html')


# from django.shortcuts import render, redirect, get_object_or_404
# from django.contrib import messages
# from django.core.mail import EmailMessage
# from django.conf import settings
# from django.utils import timezone
# from django.http import Http404
# from .forms import EmployeeSelfOnboardingForm
# from .models import Employee
# import base64
# import time
# from datetime import datetime, timedelta

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
#                 'employee_type': employee.employee_type,
#                 'department': employee.department,
#                 'position': employee.position,
#                 'address': employee.address,
#                 'joining_date': employee.joining_date,
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
# - Department: {employee.get_department_display()}
# - Position: {employee.get_position_display()}
# - Employee Type: {employee.get_employee_type_display()}
# - Joining Date: {employee.joining_date or 'Not specified'}

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
# - Department: {employee.get_department_display()}
# - Position: {employee.get_position_display()}
# - Employee Type: {employee.get_employee_type_display()}
# - Joining Date: {employee.joining_date or 'Not specified'}
# - Submission Date: {employee.submitted_at.strftime('%Y-%m-%d %H:%M')}

# {f'Link Created: {link_created_time.strftime("%Y-%m-%d %H:%M")}' if link_created_time else 'Direct submission (no timestamped link used)'}

# All required documents have been uploaded. Please review the submission in the admin panel.

# Admin Panel Link: [Your admin panel URL]/admin/onboarding/employee/{employee.id}/change/

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
# # from django.shortcuts import render, redirect, get_object_or_404
# # from django.contrib import messages
# # from django.core.mail import EmailMessage
# # from django.conf import settings
# # from django.utils import timezone
# # from django.http import Http404
# # from .forms import EmployeeSelfOnboardingForm
# # from .models import Employee
# # import base64
# # import time
# # from datetime import datetime, timedelta

# # def employee_onboarding_form(request, encoded_data=None):
# #     """View for employees to submit their onboarding information using timestamped link"""
    
# #     employee = None
# #     link_created_time = None
# #     is_expired = False
# #     is_generic_link = False
    
# #     # If encoded_data is provided, validate it
# #     if encoded_data:
# #         try:
# #             # Decode the data
# #             decoded_data = base64.urlsafe_b64decode(encoded_data.encode()).decode()
            
# #             # Check if it's a generic link or specific employee link
# #             if decoded_data.startswith('GENERIC_'):
# #                 # Generic link format: GENERIC_timestamp
# #                 is_generic_link = True
# #                 timestamp = decoded_data.replace('GENERIC_', '')
# #                 link_created_time = datetime.fromtimestamp(int(timestamp))
# #             else:
# #                 # Specific employee link format: employee_id_timestamp
# #                 employee_id, timestamp = decoded_data.split('_')
# #                 # Use objects manager to exclude soft-deleted employees
# #                 try:
# #                     employee = Employee.objects.get(id=int(employee_id))
# #                 except Employee.DoesNotExist:
# #                     # Check if employee was soft-deleted
# #                     try:
# #                         deleted_employee = Employee.all_objects.get(id=int(employee_id), is_deleted=True)
# #                         messages.error(request, 
# #                             f'This employee record has been deleted. Please contact HR for assistance.'
# #                         )
# #                         return render(request, 'onboarding/link_invalid.html', {'employee': deleted_employee})
# #                     except Employee.DoesNotExist:
# #                         raise Http404("Employee not found")
                
# #                 link_created_time = datetime.fromtimestamp(int(timestamp))
                
# #                 # Check if employee already submitted
# #                 if employee.is_self_submitted:
# #                     messages.error(request, 
# #                         f'This employee has already completed onboarding on {employee.submitted_at.strftime("%Y-%m-%d at %H:%M")}. '
# #                         f'Please contact HR if you need assistance.'
# #                     )
# #                     return render(request, 'onboarding/link_invalid.html', {'employee': employee})
            
# #             # Check if link is older than 7 days (for both generic and specific links)
# #             days_old = (datetime.now() - link_created_time).days
            
# #             if days_old >= 7:
# #                 is_expired = True
# #                 messages.error(request, 
# #                     f'This onboarding link has expired. Links are valid for 7 days only. '
# #                     f'This link was created on {link_created_time.strftime("%Y-%m-%d at %H:%M")}. '
# #                     f'Please contact HR for a new link.'
# #                 )
# #                 return render(request, 'onboarding/link_invalid.html', {
# #                     'employee': employee,
# #                     'link_created_time': link_created_time,
# #                     'is_expired': True,
# #                     'days_old': days_old,
# #                     'is_generic_link': is_generic_link
# #                 })
                
# #         except (ValueError, Employee.DoesNotExist, Exception) as e:
# #             messages.error(request, 'Invalid onboarding link. Please contact HR for assistance.')
# #             return render(request, 'onboarding/link_invalid.html')
    
# #     if request.method == 'POST':
# #         form = EmployeeSelfOnboardingForm(request.POST, request.FILES)
        
# #         if form.is_valid():
# #             try:
# #                 if employee:
# #                     # Check if employee was soft-deleted during form submission
# #                     if employee.is_deleted:
# #                         messages.error(request, 'This employee record has been deleted. Please contact HR for assistance.')
# #                         return render(request, 'onboarding/link_invalid.html', {'employee': employee})
                    
# #                     # Update existing employee record (specific employee link)
# #                     for field in form.cleaned_data:
# #                         if field not in ['aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
# #                                        'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file']:
# #                             setattr(employee, field, form.cleaned_data[field])
                    
# #                     # Handle file uploads
# #                     for field_name in ['aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
# #                                      'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file']:
# #                         if form.cleaned_data[field_name]:
# #                             setattr(employee, field_name, form.cleaned_data[field_name])
# #                             # Auto-check corresponding collection field
# #                             collection_field = field_name.replace('_file', '_collected')
# #                             setattr(employee, collection_field, True)
                    
# #                     # Mark onboarding as complete
# #                     employee.is_self_submitted = True
# #                     employee.submitted_at = timezone.now()
# #                     employee.save()
                    
# #                 else:
# #                     # Create new employee record (generic link or direct access)
# #                     # Check if email already exists (including soft-deleted)
# #                     existing_employee = Employee.all_objects.filter(email=form.cleaned_data['email']).first()
# #                     if existing_employee:
# #                         if existing_employee.is_deleted:
# #                             messages.error(request, 
# #                                 'An employee record with this email already exists but has been deleted. '
# #                                 'Please contact HR for assistance.'
# #                             )
# #                             return render(request, 'onboarding/employee_form.html', {'form': form})
# #                         elif existing_employee.is_self_submitted:
# #                             messages.error(request, 
# #                                 'An employee with this email has already completed onboarding. '
# #                                 'Please contact HR if you need assistance.'
# #                             )
# #                             return render(request, 'onboarding/employee_form.html', {'form': form})
                    
# #                     employee = form.save()
                
# #                 # Send confirmation email to employee
# #                 try:
# #                     message = f"""Hi {employee.full_name},

# # Thank you for submitting your onboarding information!

# # Your details have been successfully received and will be reviewed by our HR team. We'll contact you soon regarding the next steps.

# # Submitted Information:
# # - Name: {employee.full_name}
# # - Email: {employee.email}
# # - Phone: {employee.phone_number}
# # - Department: {employee.get_department_display()}
# # - Position: {employee.get_position_display()}
# # - Employee Type: {employee.get_employee_type_display()}
# # - Joining Date: {employee.joining_date or 'Not specified'}

# # All required documents have been uploaded successfully.

# # Best Regards,
# # HR Team - Techoptima Pvt Ltd"""

# #                     email = EmailMessage(
# #                         subject=f"Onboarding Information Received - {employee.full_name}",
# #                         body=message,
# #                         to=[employee.email],
# #                     )
# #                     email.content_subtype = "plain"
# #                     email.send()
                    
# #                 except Exception as e:
# #                     print(f"Failed to send confirmation email: {str(e)}")
                
# #                 # Send notification to HR team
# #                 try:
# #                     if is_generic_link:
# #                         submission_method = "via generic onboarding link"
# #                     elif encoded_data and not is_generic_link:
# #                         submission_method = "via specific employee onboarding link"
# #                     else:
# #                         submission_method = "direct submission"
                        
# #                     hr_message = f"""Hi HR Team,

# # A new employee has submitted their onboarding information through the self-service portal ({submission_method}).

# # Employee Details:
# # - Name: {employee.full_name}
# # - Email: {employee.email}
# # - Phone: {employee.phone_number}
# # - Department: {employee.get_department_display()}
# # - Position: {employee.get_position_display()}
# # - Employee Type: {employee.get_employee_type_display()}
# # - Joining Date: {employee.joining_date or 'Not specified'}
# # - Submission Date: {employee.submitted_at.strftime('%Y-%m-%d %H:%M')}

# # {f'Link Created: {link_created_time.strftime("%Y-%m-%d %H:%M")}' if link_created_time else 'Direct submission (no timestamped link used)'}

# # All required documents have been uploaded. Please review the submission in the admin panel.

# # Admin Panel Link: [Your admin panel URL]/admin/onboarding/employee/{employee.id}/change/

# # Best Regards,
# # System - Techoptima Pvt Ltd"""

# #                     hr_email = EmailMessage(
# #                         subject=f"New Employee Self-Submission - {employee.full_name}",
# #                         body=hr_message,
# #                         to=["hr@techoptima.com"],  # Replace with actual HR email
# #                     )
# #                     hr_email.content_subtype = "plain"
# #                     hr_email.send()
                    
# #                 except Exception as e:
# #                     print(f"Failed to send HR notification email: {str(e)}")
                
# #                 messages.success(
# #                     request, 
# #                     f'Thank you {employee.full_name}! Your onboarding information has been submitted successfully. '
# #                     'You will receive a confirmation email shortly.'
# #                 )
# #                 return redirect('onboarding:employee_onboarding_success')
                
# #             except Exception as e:
# #                 messages.error(request, f'An error occurred while submitting your information: {str(e)}')
# #         else:
# #             messages.error(request, 'Please correct the errors below and try again.')
# #     else:
# #         if employee:
# #             # Check if employee was soft-deleted
# #             if employee.is_deleted:
# #                 messages.error(request, 'This employee record has been deleted. Please contact HR for assistance.')
# #                 return render(request, 'onboarding/link_invalid.html', {'employee': employee})
            
# #             # Pre-fill form with existing employee data (specific employee link)
# #             initial_data = {
# #                 'first_name': employee.first_name,
# #                 'last_name': employee.last_name,
# #                 'email': employee.email,
# #                 'phone_number': employee.phone_number,
# #                 'employee_type': employee.employee_type,
# #                 'department': employee.department,
# #                 'position': employee.position,
# #                 'address': employee.address,
# #                 'joining_date': employee.joining_date,
# #             }
# #             form = EmployeeSelfOnboardingForm(initial=initial_data)
# #         else:
# #             # Empty form (generic link or direct access)
# #             form = EmployeeSelfOnboardingForm()
    
# #     # Calculate expiry info for display
# #     expiry_info = None
# #     if link_created_time and not is_expired:
# #         expiry_date = link_created_time + timedelta(days=7)
# #         remaining_time = expiry_date - datetime.now()
# #         days_remaining = remaining_time.days
# #         hours_remaining = remaining_time.seconds // 3600
        
# #         if days_remaining > 0:
# #             time_remaining = f"{days_remaining} day(s), {hours_remaining} hour(s)"
# #         else:
# #             time_remaining = f"{hours_remaining} hour(s)"
            
# #         expiry_info = {
# #             'expires_at': expiry_date,
# #             'time_remaining': time_remaining,
# #             'created_at': link_created_time
# #         }
    
# #     context = {
# #         'form': form,
# #         'employee': employee,
# #         'expiry_info': expiry_info,
# #         'is_generic_link': is_generic_link,
# #     }
    
# #     return render(request, 'onboarding/employee_form.html', context)

# # def employee_onboarding_success(request):
# #     """Success page after employee submits onboarding form"""
# #     return render(request, 'onboarding/success.html')




from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from django.http import Http404
from .forms import EmployeeSelfOnboardingForm
from .models import Employee
import base64
import time
from datetime import datetime, timedelta

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
                # Generic link format: GENERIC_timestamp
                is_generic_link = True
                timestamp = decoded_data.replace('GENERIC_', '')
                link_created_time = datetime.fromtimestamp(int(timestamp))
            else:
                # Specific employee link format: employee_id_timestamp
                try:
                    employee_id, timestamp = decoded_data.split('_')
                    employee_id = int(employee_id)
                except (ValueError, TypeError):
                    raise ValueError("Invalid link format")
                
                # Try to get the employee, checking soft-deleted status
                try:
                    employee = Employee.objects.get(id=employee_id)
                except Employee.DoesNotExist:
                    # Check if employee was soft-deleted
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
                    
                    # Employee doesn't exist at all
                    messages.error(request, 'Employee record not found. Please contact HR for assistance.')
                    return render(request, 'onboarding/link_invalid.html', {'reason': 'not_found'})
                
                link_created_time = datetime.fromtimestamp(int(timestamp))
                
                # Additional validation for soft-deleted employee
                if employee.is_deleted:
                    messages.error(request, 
                        f'This employee record has been deactivated by HR. Please contact HR for assistance.'
                    )
                    return render(request, 'onboarding/link_invalid.html', {
                        'employee': employee,
                        'reason': 'deleted'
                    })
                
                # Check if employee already submitted
                if employee.is_self_submitted:
                    messages.info(request, 
                        f'This employee has already completed onboarding on {employee.submitted_at.strftime("%Y-%m-%d at %H:%M")}. '
                        f'If you need to make changes, please contact HR.'
                    )
                    return render(request, 'onboarding/link_invalid.html', {
                        'employee': employee,
                        'reason': 'already_submitted'
                    })
            
            # Check if link is older than 7 days (for both generic and specific links)
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
            print(f"Link validation error: {str(e)}")  # For debugging
            messages.error(request, 'Invalid onboarding link. Please contact HR for assistance.')
            return render(request, 'onboarding/link_invalid.html', {'reason': 'invalid'})
    
    if request.method == 'POST':
        form = EmployeeSelfOnboardingForm(request.POST, request.FILES)
        
        if form.is_valid():
            try:
                if employee:
                    # Double-check employee status before processing
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
                    
                    # Update existing employee record (specific employee link)
                    for field in form.cleaned_data:
                        if field not in ['aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
                                       'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file']:
                            setattr(employee, field, form.cleaned_data[field])
                    
                    # Handle file uploads
                    for field_name in ['aadhar_pan_file', 'payslips_file', 'educational_certificates_file',
                                     'previous_offer_letter_file', 'relieving_experience_letters_file', 'appraisal_hike_letters_file']:
                        if form.cleaned_data[field_name]:
                            setattr(employee, field_name, form.cleaned_data[field_name])
                            # Auto-check corresponding collection field
                            collection_field = field_name.replace('_file', '_collected')
                            setattr(employee, collection_field, True)
                    
                    # Mark onboarding as complete
                    employee.is_self_submitted = True
                    employee.submitted_at = timezone.now()
                    employee.save()
                    
                else:
                    # Create new employee record (generic link or direct access)
                    # Check if email already exists (including soft-deleted)
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
                
                # Send confirmation email to employee
                try:
                    send_confirmation_email(employee)
                except Exception as e:
                    print(f"Failed to send confirmation email: {str(e)}")
                    # Don't fail the submission if email fails
                
                # Send notification to HR team
                try:
                    send_hr_notification(employee, is_generic_link, encoded_data, link_created_time)
                except Exception as e:
                    print(f"Failed to send HR notification email: {str(e)}")
                    # Don't fail the submission if email fails
                
                messages.success(
                    request, 
                    f'Thank you {employee.full_name}! Your onboarding information has been submitted successfully. '
                    'You will receive a confirmation email shortly.'
                )
                return redirect('onboarding:employee_onboarding_success')
                
            except Exception as e:
                print(f"Submission error: {str(e)}")  # For debugging
                messages.error(request, f'An error occurred while submitting your information. Please try again or contact HR for assistance.')
        else:
            messages.error(request, 'Please correct the errors below and try again.')
    else:
        if employee:
            # Double-check employee status before showing form
            if employee.is_deleted:
                messages.error(request, 'This employee record has been deactivated. Please contact HR for assistance.')
                return render(request, 'onboarding/link_invalid.html', {
                    'employee': employee,
                    'reason': 'deleted'
                })
            
            # Pre-fill form with existing employee data (specific employee link)
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
            # Empty form (generic link or direct access)
            form = EmployeeSelfOnboardingForm()
    
    # Calculate expiry info for display
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
- Department: {employee.get_department_display() if employee.department else 'Not specified'}
- Position: {employee.get_position_display() if employee.position else 'Not specified'}
- Employee Type: {employee.get_employee_type_display() if employee.employee_type else 'Not specified'}
- Joining Date: {employee.joining_date or 'Not specified'}

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
- Department: {employee.get_department_display()}
- Position: {employee.get_position_display()}
- Employee Type: {employee.get_employee_type_display()}
- Joining Date: {employee.joining_date or 'Not specified'}
- Submission Date: {employee.submitted_at.strftime('%Y-%m-%d %H:%M')}

{f'Link Created: {link_created_time.strftime("%Y-%m-%d %H:%M")}' if link_created_time else 'Direct submission (no timestamped link used)'}

All required documents have been uploaded. Please review the submission in the admin panel.

Admin Panel Link: [Your admin panel URL]/admin/onboarding/employee/{employee.id}/change/

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