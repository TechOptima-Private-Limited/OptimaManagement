# from django.shortcuts import render

# # Create your views here.
# # Add these to your existing views.py or create a new onboarding/views.py

# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from django.shortcuts import get_object_or_404
# from django.http import HttpResponse
# from django.template.loader import render_to_string
# from io import BytesIO
# from xhtml2pdf import pisa
# from django.core.mail import EmailMessage
# from .models import Employee, Document, OfferLetter, Asset, Offboarding
# from .serializers import (
#     EmployeeSerializer, DocumentSerializer, OfferLetterSerializer, 
#     AssetSerializer, OffboardingSerializer
# )

# class OnboardingEmployeeViewSet(viewsets.ModelViewSet):
#     queryset = Employee.objects.all()
#     serializer_class = EmployeeSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         queryset = Employee.objects.all()
#         status_filter = self.request.query_params.get('status', None)
#         employee_type = self.request.query_params.get('employee_type', None)
        
#         if status_filter:
#             queryset = queryset.filter(status=status_filter)
#         if employee_type:
#             queryset = queryset.filter(employee_type=employee_type)
            
#         return queryset.order_by('-id')

#     @action(detail=True, methods=['post'])
#     def send_offer_letter(self, request, pk=None):
#         employee = self.get_object()
        
#         # Map employee type to template
#         template_map = {
#             'intern': 'offers/offer_letter_intern.html',
#             'fresher': 'offers/offer_letter_fresher.html',
#             'experienced': 'offers/offer_letter_experienced.html',
#         }
        
#         template_name = template_map.get(employee.employee_type, 'offers/offer_letter_experienced.html')
        
#         context = {
#             'employee': employee,
#             'user_name': employee.name,
#             'joining_date': employee.joining_date,
#             'position': employee.position,
#             'salary_lpa': employee.salary_lpa,
#         }
        
#         try:
#             # Generate PDF
#             html_content = render_to_string(template_name, context)
#             result = BytesIO()
#             pdf = pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), result)
            
#             if pdf.err:
#                 return Response({'error': 'Failed to generate PDF'}, status=status.HTTP_400_BAD_REQUEST)
            
#             pdf_file = result.getvalue()
            
#             # Send email
#             email_obj = EmailMessage(
#                 subject="Welcome to Techoptima Pvt Ltd – Your Offer Letter",
#                 body=f"Hi {employee.name},\n\nPlease find your offer letter attached.",
#                 to=[employee.email],
#             )
#             email_obj.attach(f"OfferLetter_{employee.name}.pdf", pdf_file, "application/pdf")
#             email_obj.send()
            
#             # Create OfferLetter record
#             offer_letter, created = OfferLetter.objects.get_or_create(
#                 employee=employee,
#                 defaults={'letter_file': None}
#             )
            
#             return Response({'message': 'Offer letter sent successfully'})
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

#     @action(detail=True, methods=['post'])
#     def update_status(self, request, pk=None):
#         employee = self.get_object()
#         new_status = request.data.get('status')
        
#         if new_status in ['pending', 'accepted', 'rejected']:
#             employee.status = new_status
#             employee.save()
#             return Response({'message': f'Status updated to {new_status}'})
        
#         return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

# class DocumentViewSet(viewsets.ModelViewSet):
#     serializer_class = DocumentSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         employee_id = self.request.query_params.get('employee_id')
#         if employee_id:
#             return Document.objects.filter(employee_id=employee_id)
#         return Document.objects.all()

# class AssetViewSet(viewsets.ModelViewSet):
#     serializer_class = AssetSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         employee_id = self.request.query_params.get('employee_id')
#         if employee_id:
#             return Asset.objects.filter(employee_id=employee_id)
#         return Asset.objects.all()

# class OffboardingViewSet(viewsets.ModelViewSet):
#     queryset = Offboarding.objects.all()
#     serializer_class = OffboardingSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         return Offboarding.objects.all().order_by('-last_working_date')

# # onboarding/views.py
# from django.shortcuts import render
# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from django.shortcuts import get_object_or_404
# from django.http import HttpResponse
# from django.template.loader import render_to_string
# from io import BytesIO
# from xhtml2pdf import pisa
# from django.core.mail import EmailMessage
# from .models import Employee, Document, OfferLetter, Asset, Offboarding
# from .serializers import (
#     EmployeeSerializer, DocumentSerializer, OfferLetterSerializer, 
#     AssetSerializer, OffboardingSerializer
# )
# import logging

# logger = logging.getLogger(__name__)

# class OnboardingEmployeeViewSet(viewsets.ModelViewSet):
#     queryset = Employee.objects.all()
#     serializer_class = EmployeeSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         queryset = Employee.objects.all()
#         status_filter = self.request.query_params.get('status', None)
#         employee_type = self.request.query_params.get('employee_type', None)
        
#         if status_filter:
#             queryset = queryset.filter(status=status_filter)
#         if employee_type:
#             queryset = queryset.filter(employee_type=employee_type)
            
#         return queryset.order_by('-id')

#     @action(detail=True, methods=['post'])
#     def send_offer_letter(self, request, pk=None):
#         try:
#             employee = self.get_object()
#             logger.info(f"Sending offer letter for employee: {employee.name} (ID: {employee.id})")
            
#             # Check if employee has required fields
#             if not employee.name:
#                 return Response({'error': 'Employee name is required'}, status=status.HTTP_400_BAD_REQUEST)
            
#             if not employee.email:
#                 return Response({'error': 'Employee email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
#             # Map employee type to template
#             template_map = {
#                 'intern': 'offers/offer_letter_intern.html',
#                 'fresher': 'offers/offer_letter_fresher.html',
#                 'experienced': 'offers/offer_letter_experienced.html',
#             }
            
#             template_name = template_map.get(employee.employee_type, 'offers/offer_letter_experienced.html')
#             logger.info(f"Using template: {template_name}")
            
#             context = {
#                 'employee': employee,
#                 'user_name': employee.name,
#                 'joining_date': employee.joining_date,
#                 'position': employee.position or 'Not specified',
#                 'salary_lpa': employee.salary_lpa or 'To be discussed',
#             }
            
#             # Check if template exists
#             try:
#                 html_content = render_to_string(template_name, context)
#                 logger.info("Template rendered successfully")
#             except Exception as template_error:
#                 logger.error(f"Template rendering error: {str(template_error)}")
#                 # Use a simple default template
#                 html_content = f"""
#                 <html>
#                 <body>
#                     <h1>Offer Letter</h1>
#                     <p>Dear {employee.name},</p>
#                     <p>We are pleased to offer you the position of {employee.position or 'Software Developer'} at Techoptima Pvt Ltd.</p>
#                     <p>Position: {employee.position or 'Software Developer'}</p>
#                     <p>Salary: {employee.salary_lpa or 'To be discussed'} LPA</p>
#                     <p>Joining Date: {employee.joining_date or 'To be discussed'}</p>
#                     <p>Best regards,<br>HR Team<br>Techoptima Pvt Ltd</p>
#                 </body>
#                 </html>
#                 """
            
#             # Generate PDF
#             try:
#                 result = BytesIO()
#                 pdf = pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), result)
                
#                 if pdf.err:
#                     logger.error("PDF generation failed")
#                     return Response({'error': 'Failed to generate PDF'}, status=status.HTTP_400_BAD_REQUEST)
                
#                 pdf_file = result.getvalue()
#                 logger.info("PDF generated successfully")
#             except Exception as pdf_error:
#                 logger.error(f"PDF generation error: {str(pdf_error)}")
#                 return Response({'error': f'PDF generation failed: {str(pdf_error)}'}, status=status.HTTP_400_BAD_REQUEST)
            
#             # Send email
#             try:
#                 email_obj = EmailMessage(
#                     subject="Welcome to Techoptima Pvt Ltd – Your Offer Letter",
#                     body=f"Hi {employee.name},\n\nPlease find your offer letter attached.\n\nBest regards,\nHR Team",
#                     to=[employee.email],
#                 )
#                 email_obj.attach(f"OfferLetter_{employee.name}.pdf", pdf_file, "application/pdf")
#                 email_obj.send()
#                 logger.info("Email sent successfully")
#             except Exception as email_error:
#                 logger.error(f"Email sending error: {str(email_error)}")
#                 # Don't fail the request if email fails, just log it
#                 logger.warning("Email sending failed, but continuing...")
            
#             # Create OfferLetter record
#             try:
#                 offer_letter, created = OfferLetter.objects.get_or_create(
#                     employee=employee,
#                     defaults={'letter_file': None}
#                 )
#                 logger.info(f"OfferLetter record {'created' if created else 'updated'}")
#             except Exception as db_error:
#                 logger.error(f"Database error: {str(db_error)}")
#                 return Response({'error': f'Database error: {str(db_error)}'}, status=status.HTTP_400_BAD_REQUEST)
            
#             return Response({'message': 'Offer letter sent successfully'})
            
#         except Employee.DoesNotExist:
#             return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Unexpected error in send_offer_letter: {str(e)}")
#             return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     @action(detail=True, methods=['post'])
#     def update_status(self, request, pk=None):
#         try:
#             employee = self.get_object()
#             new_status = request.data.get('status')
            
#             if new_status in ['pending', 'accepted', 'rejected']:
#                 employee.status = new_status
#                 employee.save()
#                 return Response({'message': f'Status updated to {new_status}'})
            
#             return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             logger.error(f"Error updating status: {str(e)}")
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# class DocumentViewSet(viewsets.ModelViewSet):
#     serializer_class = DocumentSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         employee_id = self.request.query_params.get('employee_id')
#         if employee_id:
#             return Document.objects.filter(employee_id=employee_id)
#         return Document.objects.all()

# class AssetViewSet(viewsets.ModelViewSet):
#     serializer_class = AssetSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         employee_id = self.request.query_params.get('employee_id')
#         if employee_id:
#             return Asset.objects.filter(employee_id=employee_id)
#         return Asset.objects.all()

# class OffboardingViewSet(viewsets.ModelViewSet):
#     queryset = Offboarding.objects.all()
#     serializer_class = OffboardingSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         return Offboarding.objects.all().order_by('-last_working_date')

#############################################################################################################################
# onboarding/views.py
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.template.loader import render_to_string
from io import BytesIO
from xhtml2pdf import pisa
from django.core.mail import EmailMessage
from .models import Employee, Document, OfferLetter, Asset, Offboarding
from .serializers import (
    EmployeeSerializer, DocumentSerializer, OfferLetterSerializer, 
    AssetSerializer, OffboardingSerializer
)
import logging


logger = logging.getLogger(__name__)

class OnboardingEmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Add this for file uploads

    def get_queryset(self):
        queryset = Employee.objects.all()
        status_filter = self.request.query_params.get('status', None)
        employee_type = self.request.query_params.get('employee_type', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if employee_type:
            queryset = queryset.filter(employee_type=employee_type)
            
        return queryset.order_by('-id')

    def create(self, request, *args, **kwargs):
        """
        Simple employee creation - no file handling here
        Files are handled separately via upload_documents action
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            employee = serializer.save()
            logger.info(f"Created employee {employee.name}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    # def upload_documents(self, request, pk=None):
    #     """Upload additional documents for an existing employee"""
    #     employee = self.get_object()
        
    #     files_uploaded = []
    #     errors = []
        
    #     for key, file in request.FILES.items():
    #         if key.startswith('document_'):
    #             doc_type = key.replace('document_', '')
                
    #             try:
    #                 # Check if document type already exists for this employee
    #                 existing_doc = Document.objects.filter(
    #                     employee=employee, 
    #                     doc_type=doc_type
    #                 ).first()
                    
    #                 if existing_doc:
    #                     # Update existing document
    #                     existing_doc.file_data = file.read()
    #                     existing_doc.file_name = file.name
    #                     existing_doc.save()
    #                     files_uploaded.append({
    #                         'id': existing_doc.id,
    #                         'doc_type': doc_type,
    #                         'action': 'updated'
    #                     })
    #                 else:
    #                     # Create new document
    #                     document = Document.objects.create(
    #                         employee=employee,
    #                         doc_type=doc_type,
    #                         file_data=file.read(),
    #                         file_name=file.name
    #                     )
    #                     files_uploaded.append({
    #                         'id': document.id,
    #                         'doc_type': doc_type,
    #                         'action': 'created'
    #                     })
                        
    #             except Exception as e:
    #                 errors.append({
    #                     'doc_type': doc_type,
    #                     'error': str(e)
    #                 })
        
    #     return Response({
    #         'message': f'Processed {len(files_uploaded)} documents',
    #         'files_uploaded': files_uploaded,
    #         'errors': errors
    #     })
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_documents(self, request, pk=None):
        """Upload additional documents for an existing employee"""
        try:
            employee = self.get_object()
        except Employee.DoesNotExist:
            return Response({
                'error': 'Employee not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if not request.FILES:
            return Response({
                'error': 'No files provided for upload'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        files_uploaded = []
        errors = []
        
        # Define max file size (10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024
        
        # Allowed file extensions
        ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
        
        logger.info(f"Starting document upload for employee {employee.id} ({employee.name})")
        from django.db import transaction
        from django.utils import timezone
        import os
        
        print(f"DEBUG: Starting upload for employee {employee.id}")
        print(f"DEBUG: Files in request: {list(request.FILES.keys())}")
        
        try:
            with transaction.atomic():
                for key, uploaded_file in request.FILES.items():
                    if key.startswith('document_'):
                        doc_type = key.replace('document_', '')
                        
                        logger.info(f"Processing file: {key}, doc_type: {doc_type}")
                        print(f"DEBUG: Processing file {key}, doc_type: {doc_type}")
                        
                        try:
                            # Validate file size
                            if uploaded_file.size > MAX_FILE_SIZE:
                                errors.append({
                                    'doc_type': doc_type,
                                    'error': f'File size ({uploaded_file.size} bytes) exceeds limit of {MAX_FILE_SIZE} bytes'
                                })
                                continue
                            
                            # Validate file extension
                            file_extension = os.path.splitext(uploaded_file.name)[1].lower()
                            if file_extension not in ALLOWED_EXTENSIONS:
                                errors.append({
                                    'doc_type': doc_type,
                                    'error': f'File type {file_extension} not allowed. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
                                })
                                continue
                            
                            # Read file data
                            uploaded_file.seek(0)  # Reset file pointer to beginning
                            file_data = uploaded_file.read()
                            
                            if not file_data:
                                errors.append({
                                    'doc_type': doc_type,
                                    'error': 'File appears to be empty'
                                })
                                continue
                            
                            logger.info(f"File data read: {len(file_data)} bytes")
                            print(f"DEBUG: File data read: {len(file_data)} bytes")
                            
                            # Check if document already exists
                            existing_doc = Document.objects.filter(
                                employee=employee,
                                doc_type=doc_type
                            ).first()
                            
                            if existing_doc:
                                # Update existing document
                                existing_doc.file_data = file_data
                                existing_doc.file_name = uploaded_file.name
                                existing_doc.uploaded_at = timezone.now()
                                existing_doc.save()
                                
                                logger.info(f"Updated existing document {existing_doc.id}")
                                print(f"DEBUG: Updated existing document {existing_doc.id}")
                                
                                # Verify save
                                existing_doc.refresh_from_db()
                                print(f"DEBUG: After save - file_data length: {len(existing_doc.file_data) if existing_doc.file_data else 0}")
                                
                                files_uploaded.append({
                                    'id': existing_doc.id,
                                    'doc_type': doc_type,
                                    'file_name': uploaded_file.name,
                                    'file_size': len(file_data),
                                    'action': 'updated'
                                })
                            else:
                                # Create new document
                                new_doc = Document.objects.create(
                                    employee=employee,
                                    doc_type=doc_type,
                                    file_data=file_data,
                                    file_name=uploaded_file.name
                                )
                                
                                logger.info(f"Created new document {new_doc.id}")
                                print(f"DEBUG: Created new document {new_doc.id}")
                                
                                # Verify save
                                new_doc.refresh_from_db()
                                print(f"DEBUG: After create - file_data length: {len(new_doc.file_data) if new_doc.file_data else 0}")
                                
                                files_uploaded.append({
                                    'id': new_doc.id,
                                    'doc_type': doc_type,
                                    'file_name': uploaded_file.name,
                                    'file_size': len(file_data),
                                    'action': 'created'
                                })
                                
                        except Exception as file_error:
                            logger.error(f"Error processing file {key}: {str(file_error)}")
                            print(f"DEBUG: Error processing file {key}: {str(file_error)}")
                            import traceback
                            traceback.print_exc()
                            errors.append({
                                'doc_type': doc_type,
                                'error': f'Failed to process file: {str(file_error)}'
                            })
                
                # Log final results
                logger.info(f"Upload completed: {len(files_uploaded)} successful, {len(errors)} errors")
                print(f"DEBUG: Upload completed: {len(files_uploaded)} successful, {len(errors)} errors")
                
                return Response({
                    'message': f'Successfully processed {len(files_uploaded)} documents',
                    'files_uploaded': files_uploaded,
                    'errors': errors,
                    'employee_id': employee.id,
                    'employee_name': employee.name
                })
                
        except Exception as e:
            logger.error(f"Transaction failed during document upload: {str(e)}")
            print(f"DEBUG: Transaction failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'Failed to upload documents. Please try again.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """Get all documents for an employee"""
        employee = self.get_object()
        documents = Document.objects.filter(employee=employee)
        serializer = DocumentSerializer(documents, many=True, context={'request': request})
        return Response(serializer.data)
    @action(detail=True, methods=['get'])
    def documents_status(self, request, pk=None):
        """Get document upload status for an employee"""
        employee = self.get_object()
        
        # Define required document types
        required_documents = [
            'Aadhar and PAN Card',
            'Last 6 months payslips',
            'Educational Certificates (Degree)',
            'Previous Offer Letter',
            'Relieving & Experience Letters',
            'Appraisal/Hike Letters'
        ]

        
        # Get uploaded documents
        uploaded_documents = Document.objects.filter(employee=employee).values_list('doc_type', flat=True)
        
        # Find missing documents
        missing_documents = []
        uploaded_list = []
        
        for doc_type in required_documents:
            doc_info = {
                'doc_type': doc_type,
                'label': dict(Document.DOCUMENT_TYPE_CHOICES).get(doc_type, doc_type.replace('_', ' ').title()),
                'uploaded': doc_type in uploaded_documents
            }
            
            if doc_type in uploaded_documents:
                uploaded_list.append(doc_info)
            else:
                missing_documents.append(doc_info)
        
        # Optional documents
        optional_documents = ['experience_letter', 'other']
        optional_uploaded = []
        
        for doc_type in optional_documents:
            if doc_type in uploaded_documents:
                optional_uploaded.append({
                    'doc_type': doc_type,
                    'label': dict(Document.DOCUMENT_TYPE_CHOICES).get(doc_type, doc_type.replace('_', ' ').title()),
                    'uploaded': True
                })
        
        return Response({
            'employee_id': employee.id,
            'employee_name': employee.name,
            'total_required': len(required_documents),
            'total_uploaded': len(uploaded_list),
            'completion_percentage': round((len(uploaded_list) / len(required_documents)) * 100, 1),
            'is_complete': len(missing_documents) == 0,
            'required_documents': {
                'uploaded': uploaded_list,
                'missing': missing_documents
            },
            'optional_documents': optional_uploaded
        })
    @action(detail=True, methods=['post'])
    def send_offer_letter(self, request, pk=None):
        employee = self.get_object()
        
        # Map employee type to template
        template_map = {
            'intern': 'offers/offer_letter_intern.html',
            'fresher': 'offers/offer_letter_fresher.html',
            'experienced': 'offers/offer_letter_experienced.html',
        }
        
        template_name = template_map.get(employee.employee_type, 'offers/offer_letter_experienced.html')
        
        context = {
            'employee': employee,
            'user_name': employee.name,
            'joining_date': employee.joining_date,
            'position': employee.position,
            'salary_lpa': employee.salary_lpa,
        }
        
        try:
            # Generate PDF
            html_content = render_to_string(template_name, context)
            result = BytesIO()
            pdf = pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), result)
            
            if pdf.err:
                return Response({'error': 'Failed to generate PDF'}, status=status.HTTP_400_BAD_REQUEST)
            
            pdf_file = result.getvalue()
            
            # Send email
            email_obj = EmailMessage(
                subject="Welcome to Techoptima Pvt Ltd – Your Offer Letter",
                body=f"Hi {employee.name},\n\nPlease find your offer letter attached.",
                to=[employee.email],
            )
            email_obj.attach(f"OfferLetter_{employee.name}.pdf", pdf_file, "application/pdf")
            email_obj.send()
            
            # Create OfferLetter record
            offer_letter, created = OfferLetter.objects.get_or_create(
                employee=employee,
                defaults={'letter_file': None}
            )
            
            return Response({'message': 'Offer letter sent successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        employee = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in ['pending', 'accepted', 'rejected']:
            employee.status = new_status
            employee.save()
            return Response({'message': f'Status updated to {new_status}'})
        
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            return Document.objects.filter(employee_id=employee_id)
        return Document.objects.all()

class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            return Asset.objects.filter(employee_id=employee_id)
        return Asset.objects.all()

class OffboardingViewSet(viewsets.ModelViewSet):
    queryset = Offboarding.objects.all()
    serializer_class = OffboardingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Offboarding.objects.all().order_by('-last_working_date')


# import logging
# from io import BytesIO
# from django.core.exceptions import ValidationError, ObjectDoesNotExist
# from django.core.mail import EmailMessage
# from django.template.loader import render_to_string
# from django.db import transaction, IntegrityError
# from django.http import Http404
# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
# from rest_framework.exceptions import ValidationError as DRFValidationError
# from xhtml2pdf import pisa
# from .models import Employee, Document, OfferLetter, Asset, Offboarding
# from .serializers import EmployeeSerializer, DocumentSerializer,  AssetSerializer, OffboardingSerializer
# logger = logging.getLogger(__name__)

# class OnboardingEmployeeViewSet(viewsets.ModelViewSet):
#     queryset = Employee.objects.all()
#     serializer_class = EmployeeSerializer
#     permission_classes = [IsAuthenticated]
#     parser_classes = [MultiPartParser, FormParser, JSONParser]  # Add this for file uploads

#     def get_queryset(self):
#         queryset = Employee.objects.all()
#         status_filter = self.request.query_params.get('status', None)
#         employee_type = self.request.query_params.get('employee_type', None)
        
#         if status_filter:
#             queryset = queryset.filter(status=status_filter)
#         if employee_type:
#             queryset = queryset.filter(employee_type=employee_type)
            
#         return queryset.order_by('-id')

#     def create(self, request, *args, **kwargs):
#         """
#         Simple employee creation - no file handling here
#         Files are handled separately via upload_documents action
#         """
#         try:
#             serializer = self.get_serializer(data=request.data)
            
#             if not serializer.is_valid():
#                 logger.warning(f"Employee creation validation failed: {serializer.errors}")
#                 return Response({
#                     'error': 'Validation failed',
#                     'details': serializer.errors
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             with transaction.atomic():
#                 employee = serializer.save()
#                 logger.info(f"Created employee {employee.name} with ID {employee.id}")
                
#             return Response({
#                 'message': 'Employee created successfully',
#                 'data': serializer.data
#             }, status=status.HTTP_201_CREATED)
            
#         except IntegrityError as e:
#             logger.error(f"Database integrity error during employee creation: {str(e)}")
#             return Response({
#                 'error': 'Employee with this email or employee ID already exists'
#             }, status=status.HTTP_400_BAD_REQUEST)
            
#         except ValidationError as e:
#             logger.error(f"Validation error during employee creation: {str(e)}")
#             return Response({
#                 'error': 'Invalid data provided',
#                 'details': str(e)
#             }, status=status.HTTP_400_BAD_REQUEST)
            
#         except Exception as e:
#             logger.error(f"Unexpected error during employee creation: {str(e)}")
#             return Response({
#                 'error': 'Failed to create employee. Please try again.'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
#     def upload_documents(self, request, pk=None):
#         """Upload additional documents for an existing employee"""
#         try:
#             employee = self.get_object()
#         except Http404:
#             return Response({
#                 'error': 'Employee not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error retrieving employee {pk}: {str(e)}")
#             return Response({
#                 'error': 'Failed to retrieve employee'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
#         if not request.FILES:
#             return Response({
#                 'error': 'No files provided for upload'
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         files_uploaded = []
#         errors = []
        
#         try:
#             with transaction.atomic():
#                 for key, file in request.FILES.items():
#                     if key.startswith('document_'):
#                         doc_type = key.replace('document_', '')
                        
#                         try:
#                             # Validate file size (10MB limit)
#                             if file.size > 10 * 1024 * 1024:
#                                 errors.append({
#                                     'doc_type': doc_type,
#                                     'error': 'File size exceeds 10MB limit'
#                                 })
#                                 continue
                            
#                             # Validate file type
#                             allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
#                             if not any(file.name.lower().endswith(ext) for ext in allowed_extensions):
#                                 errors.append({
#                                     'doc_type': doc_type,
#                                     'error': f'File type not allowed. Allowed types: {", ".join(allowed_extensions)}'
#                                 })
#                                 continue
                            
#                             # Check if document type already exists for this employee
#                             existing_doc = Document.objects.filter(
#                                 employee=employee, 
#                                 doc_type=doc_type
#                             ).first()
                            
#                             if existing_doc:
#                                 # Update existing document
#                                 existing_doc.file_data = file.read()
#                                 existing_doc.file_name = file.name
#                                 existing_doc.save()
#                                 files_uploaded.append({
#                                     'id': existing_doc.id,
#                                     'doc_type': doc_type,
#                                     'file_name': file.name,
#                                     'action': 'updated'
#                                 })
#                             else:
#                                 # Create new document
#                                 document = Document.objects.create(
#                                     employee=employee,
#                                     doc_type=doc_type,
#                                     file_data=file.read(),
#                                     file_name=file.name
#                                 )
#                                 files_uploaded.append({
#                                     'id': document.id,
#                                     'doc_type': doc_type,
#                                     'file_name': file.name,
#                                     'action': 'created'
#                                 })
                                
#                         except Exception as e:
#                             logger.error(f"Error processing document {doc_type} for employee {employee.id}: {str(e)}")
#                             errors.append({
#                                 'doc_type': doc_type,
#                                 'error': f'Failed to process document: {str(e)}'
#                             })
                
#                 if files_uploaded:
#                     logger.info(f"Successfully processed {len(files_uploaded)} documents for employee {employee.id}")
                
#                 return Response({
#                     'message': f'Processed {len(files_uploaded)} documents successfully',
#                     'files_uploaded': files_uploaded,
#                     'errors': errors,
#                     'success_count': len(files_uploaded),
#                     'error_count': len(errors)
#                 })
                
#         except Exception as e:
#             logger.error(f"Transaction failed during document upload for employee {employee.id}: {str(e)}")
#             return Response({
#                 'error': 'Failed to upload documents. Please try again.'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     @action(detail=True, methods=['get'])
#     def documents(self, request, pk=None):
#         """Get all documents for an employee"""
#         try:
#             employee = self.get_object()
#             documents = Document.objects.filter(employee=employee)
#             serializer = DocumentSerializer(documents, many=True, context={'request': request})
            
#             logger.info(f"Retrieved {documents.count()} documents for employee {employee.id}")
#             return Response({
#                 'employee_id': employee.id,
#                 'employee_name': employee.name,
#                 'documents': serializer.data,
#                 'total_documents': documents.count()
#             })
            
#         except Http404:
#             return Response({
#                 'error': 'Employee not found'
#             }, status=status.HTTP_404_NOT_FOUND)
            
#         except Exception as e:
#             logger.error(f"Error retrieving documents for employee {pk}: {str(e)}")
#             return Response({
#                 'error': 'Failed to retrieve documents'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     @action(detail=True, methods=['get'])
#     def documents_status(self, request, pk=None):
#         """Get document upload status for an employee"""
#         try:
#             employee = self.get_object()
#         except Http404:
#             return Response({
#                 'error': 'Employee not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error retrieving employee {pk}: {str(e)}")
#             return Response({
#                 'error': 'Failed to retrieve employee'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
#         try:
#             # Define required document types
#             required_documents = [
#                 'Aadhar and PAN Card',
#                 'Last 6 months payslips',
#                 'Educational Certificates (Degree)',
#                 'Previous Offer Letter',
#                 'Relieving & Experience Letters',
#                 'Appraisal/Hike Letters'
#             ]
            
#             # Get uploaded documents
#             uploaded_documents = Document.objects.filter(employee=employee).values_list('doc_type', flat=True)
            
#             # Find missing documents
#             missing_documents = []
#             uploaded_list = []
            
#             for doc_type in required_documents:
#                 doc_info = {
#                     'doc_type': doc_type,
#                     'label': dict(Document.DOCUMENT_TYPE_CHOICES).get(doc_type, doc_type.replace('_', ' ').title()),
#                     'uploaded': doc_type in uploaded_documents
#                 }
                
#                 if doc_type in uploaded_documents:
#                     uploaded_list.append(doc_info)
#                 else:
#                     missing_documents.append(doc_info)
            
#             # Optional documents
#             optional_documents = ['experience_letter', 'other']
#             optional_uploaded = []
            
#             for doc_type in optional_documents:
#                 if doc_type in uploaded_documents:
#                     optional_uploaded.append({
#                         'doc_type': doc_type,
#                         'label': dict(Document.DOCUMENT_TYPE_CHOICES).get(doc_type, doc_type.replace('_', ' ').title()),
#                         'uploaded': True
#                     })
            
#             completion_percentage = round((len(uploaded_list) / len(required_documents)) * 100, 1) if required_documents else 0
            
#             return Response({
#                 'employee_id': employee.id,
#                 'employee_name': employee.name,
#                 'total_required': len(required_documents),
#                 'total_uploaded': len(uploaded_list),
#                 'completion_percentage': completion_percentage,
#                 'is_complete': len(missing_documents) == 0,
#                 'required_documents': {
#                     'uploaded': uploaded_list,
#                     'missing': missing_documents
#                 },
#                 'optional_documents': optional_uploaded
#             })
            
#         except Exception as e:
#             logger.error(f"Error calculating document status for employee {employee.id}: {str(e)}")
#             return Response({
#                 'error': 'Failed to calculate document status'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     @action(detail=True, methods=['post'])
#     def send_offer_letter(self, request, pk=None):
#         try:
#             employee = self.get_object()
#         except Http404:
#             return Response({
#                 'error': 'Employee not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error retrieving employee {pk}: {str(e)}")
#             return Response({
#                 'error': 'Failed to retrieve employee'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
#         # Validate required fields
#         if not employee.email:
#             return Response({
#                 'error': 'Employee email is required to send offer letter'
#             }, status=status.HTTP_400_BAD_REQUEST)
            
#         if not employee.name:
#             return Response({
#                 'error': 'Employee name is required'
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             # Map employee type to template
#             template_map = {
#                 'intern': 'offers/offer_letter_intern.html',
#                 'fresher': 'offers/offer_letter_fresher.html',
#                 'experienced': 'offers/offer_letter_experienced.html',
#             }
            
#             template_name = template_map.get(employee.employee_type, 'offers/offer_letter_experienced.html')
            
#             context = {
#                 'employee': employee,
#                 'user_name': employee.name,
#                 'joining_date': employee.joining_date,
#                 'position': employee.position,
#                 'salary_lpa': employee.salary_lpa,
#             }
            
#             # Generate PDF
#             try:
#                 html_content = render_to_string(template_name, context)
#             except Exception as e:
#                 logger.error(f"Error rendering template {template_name}: {str(e)}")
#                 return Response({
#                     'error': 'Failed to generate offer letter template'
#                 }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
#             result = BytesIO()
#             pdf = pisa.pisaDocument(BytesIO(html_content.encode("UTF-8")), result)
            
#             if pdf.err:
#                 logger.error(f"PDF generation failed for employee {employee.id}")
#                 return Response({
#                     'error': 'Failed to generate PDF offer letter'
#                 }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
#             pdf_file = result.getvalue()
            
#             # Send email
#             try:
#                 email_obj = EmailMessage(
#                     subject="Welcome to Techoptima Pvt Ltd – Your Offer Letter",
#                     body=f"Hi {employee.name},\n\nPlease find your offer letter attached.\n\nBest regards,\nTechoptima HR Team",
#                     to=[employee.email],
#                 )
#                 email_obj.attach(f"OfferLetter_{employee.name.replace(' ', '_')}.pdf", pdf_file, "application/pdf")
#                 email_obj.send()
                
#                 logger.info(f"Offer letter sent successfully to {employee.email}")
                
#             except Exception as e:
#                 logger.error(f"Failed to send email to {employee.email}: {str(e)}")
#                 return Response({
#                     'error': 'Failed to send offer letter email. Please check email configuration.'
#                 }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
#             # Create OfferLetter record
#             try:
#                 with transaction.atomic():
#                     offer_letter, created = OfferLetter.objects.get_or_create(
#                         employee=employee,
#                         defaults={'letter_file': None}
#                     )
                    
#                     if not created:
#                         # Update timestamp if record already exists
#                         offer_letter.save()
                        
#             except Exception as e:
#                 logger.error(f"Failed to create OfferLetter record for employee {employee.id}: {str(e)}")
#                 # Don't return error here as email was sent successfully
            
#             return Response({
#                 'message': 'Offer letter sent successfully',
#                 'employee_email': employee.email,
#                 'employee_name': employee.name
#             })
            
#         except Exception as e:
#             logger.error(f"Unexpected error sending offer letter for employee {employee.id}: {str(e)}")
#             return Response({
#                 'error': 'An unexpected error occurred while sending the offer letter'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     @action(detail=True, methods=['post'])
#     def update_status(self, request, pk=None):
#         try:
#             employee = self.get_object()
#         except Http404:
#             return Response({
#                 'error': 'Employee not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error retrieving employee {pk}: {str(e)}")
#             return Response({
#                 'error': 'Failed to retrieve employee'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
#         new_status = request.data.get('status')
        
#         if not new_status:
#             return Response({
#                 'error': 'Status is required'
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         valid_statuses = ['pending', 'accepted', 'rejected']
#         if new_status not in valid_statuses:
#             return Response({
#                 'error': f'Invalid status. Valid options are: {", ".join(valid_statuses)}'
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             old_status = employee.status
#             employee.status = new_status
#             employee.save()
            
#             logger.info(f"Employee {employee.id} status updated from {old_status} to {new_status}")
            
#             return Response({
#                 'message': f'Status updated from {old_status} to {new_status}',
#                 'employee_id': employee.id,
#                 'employee_name': employee.name,
#                 'old_status': old_status,
#                 'new_status': new_status
#             })
            
#         except Exception as e:
#             logger.error(f"Failed to update status for employee {employee.id}: {str(e)}")
#             return Response({
#                 'error': 'Failed to update employee status'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class DocumentViewSet(viewsets.ModelViewSet):
#     serializer_class = DocumentSerializer
#     permission_classes = [IsAuthenticated]
#     parser_classes = [MultiPartParser, FormParser]

#     def get_queryset(self):
#         try:
#             employee_id = self.request.query_params.get('employee_id')
#             if employee_id:
#                 try:
#                     # Validate employee_id is integer
#                     int(employee_id)
#                     return Document.objects.filter(employee_id=employee_id)
#                 except (ValueError, TypeError):
#                     logger.warning(f"Invalid employee_id parameter: {employee_id}")
#                     return Document.objects.none()
#             return Document.objects.all()
#         except Exception as e:
#             logger.error(f"Error in DocumentViewSet get_queryset: {str(e)}")
#             return Document.objects.none()

#     def create(self, request, *args, **kwargs):
#         try:
#             serializer = self.get_serializer(data=request.data)
            
#             if not serializer.is_valid():
#                 return Response({
#                     'error': 'Validation failed',
#                     'details': serializer.errors
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             with transaction.atomic():
#                 document = serializer.save()
#                 logger.info(f"Document created with ID {document.id}")
                
#             return Response({
#                 'message': 'Document created successfully',
#                 'data': serializer.data
#             }, status=status.HTTP_201_CREATED)
            
#         except IntegrityError as e:
#             logger.error(f"Database integrity error during document creation: {str(e)}")
#             return Response({
#                 'error': 'Document creation failed due to data constraints'
#             }, status=status.HTTP_400_BAD_REQUEST)
            
#         except Exception as e:
#             logger.error(f"Unexpected error during document creation: {str(e)}")
#             return Response({
#                 'error': 'Failed to create document'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def retrieve(self, request, *args, **kwargs):
#         try:
#             instance = self.get_object()
#             serializer = self.get_serializer(instance)
#             return Response(serializer.data)
#         except Http404:
#             return Response({
#                 'error': 'Document not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error retrieving document: {str(e)}")
#             return Response({
#                 'error': 'Failed to retrieve document'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def update(self, request, *args, **kwargs):
#         try:
#             instance = self.get_object()
#             serializer = self.get_serializer(instance, data=request.data)
            
#             if not serializer.is_valid():
#                 return Response({
#                     'error': 'Validation failed',
#                     'details': serializer.errors
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             with transaction.atomic():
#                 document = serializer.save()
#                 logger.info(f"Document {document.id} updated successfully")
                
#             return Response({
#                 'message': 'Document updated successfully',
#                 'data': serializer.data
#             })
            
#         except Http404:
#             return Response({
#                 'error': 'Document not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error updating document: {str(e)}")
#             return Response({
#                 'error': 'Failed to update document'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def destroy(self, request, *args, **kwargs):
#         try:
#             instance = self.get_object()
#             document_id = instance.id
            
#             with transaction.atomic():
#                 instance.delete()
#                 logger.info(f"Document {document_id} deleted successfully")
                
#             return Response({
#                 'message': 'Document deleted successfully'
#             }, status=status.HTTP_204_NO_CONTENT)
            
#         except Http404:
#             return Response({
#                 'error': 'Document not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error deleting document: {str(e)}")
#             return Response({
#                 'error': 'Failed to delete document'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class AssetViewSet(viewsets.ModelViewSet):
#     serializer_class = AssetSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         try:
#             employee_id = self.request.query_params.get('employee_id')
#             if employee_id:
#                 try:
#                     # Validate employee_id is integer
#                     int(employee_id)
#                     return Asset.objects.filter(employee_id=employee_id)
#                 except (ValueError, TypeError):
#                     logger.warning(f"Invalid employee_id parameter: {employee_id}")
#                     return Asset.objects.none()
#             return Asset.objects.all()
#         except Exception as e:
#             logger.error(f"Error in AssetViewSet get_queryset: {str(e)}")
#             return Asset.objects.none()

#     def create(self, request, *args, **kwargs):
#         try:
#             serializer = self.get_serializer(data=request.data)
            
#             if not serializer.is_valid():
#                 return Response({
#                     'error': 'Validation failed',
#                     'details': serializer.errors
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             with transaction.atomic():
#                 asset = serializer.save()
#                 logger.info(f"Asset created with ID {asset.id}")
                
#             return Response({
#                 'message': 'Asset created successfully',
#                 'data': serializer.data
#             }, status=status.HTTP_201_CREATED)
            
#         except IntegrityError as e:
#             logger.error(f"Database integrity error during asset creation: {str(e)}")
#             return Response({
#                 'error': 'Asset creation failed. Asset might already be assigned or invalid data provided.'
#             }, status=status.HTTP_400_BAD_REQUEST)
            
#         except Exception as e:
#             logger.error(f"Unexpected error during asset creation: {str(e)}")
#             return Response({
#                 'error': 'Failed to create asset'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def retrieve(self, request, *args, **kwargs):
#         try:
#             instance = self.get_object()
#             serializer = self.get_serializer(instance)
#             return Response(serializer.data)
#         except Http404:
#             return Response({
#                 'error': 'Asset not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error retrieving asset: {str(e)}")
#             return Response({
#                 'error': 'Failed to retrieve asset'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def update(self, request, *args, **kwargs):
#         try:
#             instance = self.get_object()
#             serializer = self.get_serializer(instance, data=request.data)
            
#             if not serializer.is_valid():
#                 return Response({
#                     'error': 'Validation failed',
#                     'details': serializer.errors
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             with transaction.atomic():
#                 asset = serializer.save()
#                 logger.info(f"Asset {asset.id} updated successfully")
                
#             return Response({
#                 'message': 'Asset updated successfully',
#                 'data': serializer.data
#             })
            
#         except Http404:
#             return Response({
#                 'error': 'Asset not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error updating asset: {str(e)}")
#             return Response({
#                 'error': 'Failed to update asset'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def destroy(self, request, *args, **kwargs):
#         try:
#             instance = self.get_object()
#             asset_id = instance.id
            
#             with transaction.atomic():
#                 instance.delete()
#                 logger.info(f"Asset {asset_id} deleted successfully")
                
#             return Response({
#                 'message': 'Asset deleted successfully'
#             }, status=status.HTTP_204_NO_CONTENT)
            
#         except Http404:
#             return Response({
#                 'error': 'Asset not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error deleting asset: {str(e)}")
#             return Response({
#                 'error': 'Failed to delete asset'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class OffboardingViewSet(viewsets.ModelViewSet):
#     queryset = Offboarding.objects.all()
#     serializer_class = OffboardingSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         try:
#             return Offboarding.objects.all().order_by('-last_working_date')
#         except Exception as e:
#             logger.error(f"Error in OffboardingViewSet get_queryset: {str(e)}")
#             return Offboarding.objects.none()

#     def create(self, request, *args, **kwargs):
#         try:
#             serializer = self.get_serializer(data=request.data)
            
#             if not serializer.is_valid():
#                 return Response({
#                     'error': 'Validation failed',
#                     'details': serializer.errors
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             with transaction.atomic():
#                 offboarding = serializer.save()
#                 logger.info(f"Offboarding record created with ID {offboarding.id}")
                
#             return Response({
#                 'message': 'Offboarding record created successfully',
#                 'data': serializer.data
#             }, status=status.HTTP_201_CREATED)
            
#         except IntegrityError as e:
#             logger.error(f"Database integrity error during offboarding creation: {str(e)}")
#             return Response({
#                 'error': 'Offboarding record creation failed. Employee might already have an active offboarding record.'
#             }, status=status.HTTP_400_BAD_REQUEST)
            
#         except Exception as e:
#             logger.error(f"Unexpected error during offboarding creation: {str(e)}")
#             return Response({
#                 'error': 'Failed to create offboarding record'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def retrieve(self, request, *args, **kwargs):
#         try:
#             instance = self.get_object()
#             serializer = self.get_serializer(instance)
#             return Response(serializer.data)
#         except Http404:
#             return Response({
#                 'error': 'Offboarding record not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error retrieving offboarding record: {str(e)}")
#             return Response({
#                 'error': 'Failed to retrieve offboarding record'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def update(self, request, *args, **kwargs):
#         try:
#             instance = self.get_object()
#             serializer = self.get_serializer(instance, data=request.data)
            
#             if not serializer.is_valid():
#                 return Response({
#                     'error': 'Validation failed',
#                     'details': serializer.errors
#                 }, status=status.HTTP_400_BAD_REQUEST)
            
#             with transaction.atomic():
#                 offboarding = serializer.save()
#                 logger.info(f"Offboarding record {offboarding.id} updated successfully")
                
#             return Response({
#                 'message': 'Offboarding record updated successfully',
#                 'data': serializer.data
#             })
            
#         except Http404:
#             return Response({
#                 'error': 'Offboarding record not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error updating offboarding record: {str(e)}")
#             return Response({
#                 'error': 'Failed to update offboarding record'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def destroy(self, request, *args, **kwargs):
#         try:
#             instance = self.get_object()
#             offboarding_id = instance.id
            
#             with transaction.atomic():
#                 instance.delete()
#                 logger.info(f"Offboarding record {offboarding_id} deleted successfully")
                
#             return Response({
#                 'message': 'Offboarding record deleted successfully'
#             }, status=status.HTTP_204_NO_CONTENT)
            
#         except Http404:
#             return Response({
#                 'error': 'Offboarding record not found'
#             }, status=status.HTTP_404_NOT_FOUND)
#         except Exception as e:
#             logger.error(f"Error delating offboarding record: {str(e)}")
#             return Response({
#                 'error': 'Failed to delating offboarding record'
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)