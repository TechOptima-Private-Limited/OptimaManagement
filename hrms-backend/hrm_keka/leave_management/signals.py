# from django.db.models.signals import post_save, pre_save
# from django.dispatch import receiver
# from .models import LeaveRequest
# from .services import LeaveNotificationService
# import logging

# logger = logging.getLogger(__name__)

# @receiver(pre_save, sender=LeaveRequest)
# def store_previous_status(sender, instance, **kwargs):
#     """
#     Store the previous status before saving to track status changes
#     """
#     try:
#         if instance.pk:
#             # Get the current state from database before saving
#             old_instance = LeaveRequest.objects.get(pk=instance.pk)
#             instance._previous_status = old_instance.status
#             logger.debug(f"🔍 Previous status stored: {old_instance.status} -> {instance.status}")
#         else:
#             # New instance
#             instance._previous_status = None
#             logger.debug("🔍 New leave request - no previous status")
#     except LeaveRequest.DoesNotExist:
#         instance._previous_status = None
#         logger.warning("⚠️ Could not find previous instance in pre_save")

# @receiver(post_save, sender=LeaveRequest)
# def handle_leave_request_notifications(sender, instance, created, **kwargs):
#     """
#     Handle leave request notifications when leave requests are created or updated
#     """
#     try:
#         if created:
#             # New leave request created - notify approvers
#             logger.info(f"📧 New leave request created for {instance.employee.user.get_full_name()}")
#             logger.info(f"🔍 Leave details: ID={instance.id}, Type={instance.leave_type.name}, Status={instance.status}")
            
#             # Send notifications for new leave requests
#             try:
#                 LeaveNotificationService.notify_leave_request_submitted(instance)
#                 logger.info("✅ New leave request notifications sent successfully")
#             except Exception as notification_error:
#                 logger.error(f"❌ Failed to send new leave request notifications: {notification_error}")
            
#         else:
#             # Existing leave request updated - check for status changes
#             previous_status = getattr(instance, '_previous_status', None)
#             current_status = instance.status
            
#             logger.info(f"🔄 Leave request updated: {previous_status} -> {current_status}")
            
#             # Only process if status actually changed
#             if previous_status and previous_status != current_status:
#                 logger.info(f"🔄 Status changed from {previous_status} to {current_status}")
                
#                 # Handle APPROVED status
#                 if previous_status == 'PENDING' and current_status == 'APPROVED':
#                     logger.info(f"✅ Leave request approved for {instance.employee.user.get_full_name()}")
#                     try:
#                         LeaveNotificationService.notify_leave_approved(instance, instance.approved_by)
#                         logger.info("✅ Leave approval notifications sent successfully")
#                     except Exception as approval_error:
#                         logger.error(f"❌ Failed to send approval notifications: {approval_error}")
                
#                 # Handle REJECTED status
#                 elif previous_status == 'PENDING' and current_status == 'REJECTED':
#                     logger.info(f"❌ Leave request rejected for {instance.employee.user.get_full_name()}")
#                     try:
#                         # Get the person who rejected it
#                         rejected_by = instance.approved_by
#                         if not rejected_by:
#                             # Fallback to manager if no approved_by is set
#                             try:
#                                 rejected_by = instance.employee.manager.user if hasattr(instance.employee, 'manager') and instance.employee.manager else None
#                             except:
#                                 rejected_by = None
                        
#                         # Get rejection reason
#                         rejection_reason = (
#                             instance.rejection_reason or 
#                             instance.manager_comments or 
#                             'No reason provided'
#                         )
                        
#                         LeaveNotificationService.notify_leave_rejected(
#                             instance,
#                             rejected_by,
#                             rejection_reason
#                         )
#                         logger.info("✅ Leave rejection notifications sent successfully")
#                     except Exception as rejection_error:
#                         logger.error(f"❌ Failed to send rejection notifications: {rejection_error}")
                
#                 # Handle CANCELLED status
#                 elif previous_status in ['PENDING', 'APPROVED'] and current_status == 'CANCELLED':
#                     logger.info(f"🚫 Leave request cancelled for {instance.employee.user.get_full_name()}")
#                     try:
#                         LeaveNotificationService.notify_leave_cancelled(instance)
#                         logger.info("✅ Leave cancellation notifications sent successfully")
#                     except Exception as cancellation_error:
#                         logger.error(f"❌ Failed to send cancellation notifications: {cancellation_error}")
                
#                 # Handle other status changes
#                 else:
#                     logger.info(f"ℹ️ Status change {previous_status} -> {current_status} - no specific notification handler")
            
#             else:
#                 # Status didn't change or no previous status
#                 if previous_status:
#                     logger.debug(f"🔍 Leave request updated but status unchanged: {current_status}")
#                 else:
#                     logger.debug("🔍 Leave request updated but no previous status tracked")
                    
#     except Exception as e:
#         logger.error(f"❌ Error in leave request notification handler: {e}")
#         logger.exception("Full error traceback:")

# # Additional signal for debugging - remove in production
# @receiver(post_save, sender=LeaveRequest)
# def debug_leave_request_changes(sender, instance, created, **kwargs):
#     """
#     Debug signal to log all leave request changes - useful for troubleshooting
#     Remove this in production or set to debug level
#     """
#     if logger.isEnabledFor(logging.DEBUG):
#         if created:
#             logger.debug(f"🐛 DEBUG: New LeaveRequest created - ID: {instance.id}")
#         else:
#             previous_status = getattr(instance, '_previous_status', 'Unknown')
#             logger.debug(f"🐛 DEBUG: LeaveRequest {instance.id} updated - Status: {previous_status} -> {instance.status}")
#             logger.debug(f"🐛 DEBUG: Employee: {instance.employee.user.get_full_name()}")
#             logger.debug(f"🐛 DEBUG: Leave type: {instance.leave_type.name}")
#             logger.debug(f"🐛 DEBUG: Dates: {instance.start_date} to {instance.end_date}")


# from django.db.models.signals import post_save, pre_save
# from django.dispatch import receiver
# from .models import LeaveRequest
# from .services import LeaveNotificationService, LeaveBalanceService
# import logging

# logger = logging.getLogger(__name__)

# @receiver(pre_save, sender=LeaveRequest)
# def store_previous_status(sender, instance, **kwargs):
#     """
#     Store the previous status before saving to track status changes
#     """
#     try:
#         if instance.pk:
#             # Get the current state from database before saving
#             old_instance = LeaveRequest.objects.get(pk=instance.pk)
#             instance._previous_status = old_instance.status
#             logger.debug(f"🔍 Previous status stored: {old_instance.status} -> {instance.status}")
#         else:
#             # New instance
#             instance._previous_status = None
#             logger.debug("🔍 New leave request - no previous status")
#     except LeaveRequest.DoesNotExist:
#         instance._previous_status = None
#         logger.warning("⚠️ Could not find previous instance in pre_save")

# @receiver(post_save, sender=LeaveRequest)
# def handle_leave_request_status_changes(sender, instance, created, **kwargs):
#     """
#     Handle leave request status changes and balance updates
#     """
#     try:
#         if created:
#             # New leave request created - only send notifications, DON'T deduct balance
#             logger.info(f"📧 New leave request created for {instance.employee.user.get_full_name()}")
#             logger.info(f"🔍 Leave details: ID={instance.id}, Type={instance.leave_type.name}, Status={instance.status}, Days={instance.days_requested}")
            
#             # Send notifications for new leave requests
#             try:
#                 LeaveNotificationService.notify_leave_request_submitted(instance)
#                 logger.info("✅ New leave request notifications sent successfully")
#             except Exception as notification_error:
#                 logger.error(f"❌ Failed to send new leave request notifications: {notification_error}")
            
#         else:
#             # Existing leave request updated - check for status changes
#             previous_status = getattr(instance, '_previous_status', None)
#             current_status = instance.status
            
#             logger.info(f"🔄 Leave request updated: {previous_status} -> {current_status} for {instance.employee.user.get_full_name()}")
            
#             # Only process if status actually changed
#             if previous_status and previous_status != current_status:
#                 logger.info(f"🔄 Status changed from {previous_status} to {current_status} - Leave ID: {instance.id}")
                
#                 # Handle APPROVED status - DEDUCT BALANCE HERE
#                 if previous_status == 'PENDING' and current_status == 'APPROVED':
#                     logger.info(f"✅ Leave request approved for {instance.employee.user.get_full_name()} - {instance.leave_type.name} - {instance.days_requested} days")
                    
#                     # Deduct leave balance when approved
#                     try:
#                         updated_balance = LeaveBalanceService.deduct_leave_balance(instance)
#                         logger.info(f"✅ Leave balance updated - Used: {updated_balance.used_days}, Remaining: {updated_balance.remaining_days}")
#                     except Exception as balance_error:
#                         logger.error(f"❌ Failed to deduct leave balance: {balance_error}")
#                         # Log the error but don't revert approval - HR can fix manually
                    
#                     # Send approval notifications
#                     try:
#                         LeaveNotificationService.notify_leave_approved(instance, instance.approved_by)
#                         logger.info("✅ Leave approval notifications sent successfully")
#                     except Exception as approval_error:
#                         logger.error(f"❌ Failed to send approval notifications: {approval_error}")
                
#                 # Handle REJECTED status
#                 elif previous_status == 'PENDING' and current_status == 'REJECTED':
#                     logger.info(f"❌ Leave request rejected for {instance.employee.user.get_full_name()}")
#                     try:
#                         # Get the person who rejected it
#                         rejected_by = instance.approved_by
#                         if not rejected_by:
#                             # Fallback to manager if no approved_by is set
#                             try:
#                                 rejected_by = instance.employee.manager.user if hasattr(instance.employee, 'manager') and instance.employee.manager else None
#                             except:
#                                 rejected_by = None
                        
#                         # Get rejection reason
#                         rejection_reason = (
#                             instance.rejection_reason or 
#                             instance.manager_comments or 
#                             'No reason provided'
#                         )
                        
#                         LeaveNotificationService.notify_leave_rejected(
#                             instance,
#                             rejected_by,
#                             rejection_reason
#                         )
#                         logger.info("✅ Leave rejection notifications sent successfully")
#                     except Exception as rejection_error:
#                         logger.error(f"❌ Failed to send rejection notifications: {rejection_error}")
                
#                 # Handle CANCELLED status
#                 elif current_status == 'CANCELLED':
#                     logger.info(f"🚫 Leave request cancelled for {instance.employee.user.get_full_name()}")
                    
#                     # If approved leave was cancelled, restore balance
#                     if previous_status == 'APPROVED':
#                         try:
#                             restored_balance = LeaveBalanceService.restore_leave_balance(instance)
#                             logger.info(f"✅ Leave balance restored - Used: {restored_balance.used_days}, Remaining: {restored_balance.remaining_days}")
#                         except Exception as restore_error:
#                             logger.error(f"❌ Failed to restore leave balance: {restore_error}")
                    
#                     # Send cancellation notifications
#                     try:
#                         LeaveNotificationService.notify_leave_cancelled(instance)
#                         logger.info("✅ Leave cancellation notifications sent successfully")
#                     except Exception as cancellation_error:
#                         logger.error(f"❌ Failed to send cancellation notifications: {cancellation_error}")
                
#                 # Handle status change from APPROVED back to PENDING (rare case)
#                 elif previous_status == 'APPROVED' and current_status == 'PENDING':
#                     logger.info(f"🔄 Leave request reverted from approved to pending: {instance.id}")
#                     try:
#                         restored_balance = LeaveBalanceService.restore_leave_balance(instance)
#                         logger.info(f"✅ Leave balance restored for reverted leave - Used: {restored_balance.used_days}, Remaining: {restored_balance.remaining_days}")
#                     except Exception as restore_error:
#                         logger.error(f"❌ Failed to restore leave balance: {restore_error}")
                
#                 # Handle other status changes
#                 else:
#                     logger.info(f"ℹ️ Status change {previous_status} -> {current_status} - no balance changes needed")
            
#             else:
#                 # Status didn't change or no previous status
#                 if previous_status:
#                     logger.debug(f"🔍 Leave request updated but status unchanged: {current_status}")
#                 else:
#                     logger.debug("🔍 Leave request updated but no previous status tracked")
                    
#     except Exception as e:
#         logger.error(f"❌ Error in leave request status change handler: {e}")
#         logger.exception("Full error traceback:")

# # Additional signal for debugging - remove in production
# @receiver(post_save, sender=LeaveRequest)
# def debug_leave_request_changes(sender, instance, created, **kwargs):
#     """
#     Debug signal to log all leave request changes - useful for troubleshooting
#     Remove this in production or set to debug level
#     """
#     if logger.isEnabledFor(logging.DEBUG):
#         if created:
#             logger.debug(f"🐛 DEBUG: New LeaveRequest created - ID: {instance.id}")
#         else:
#             previous_status = getattr(instance, '_previous_status', 'Unknown')
#             logger.debug(f"🐛 DEBUG: LeaveRequest {instance.id} updated - Status: {previous_status} -> {instance.status}")
#             logger.debug(f"🐛 DEBUG: Employee: {instance.employee.user.get_full_name()}")
#             logger.debug(f"🐛 DEBUG: Leave type: {instance.leave_type.name}")
#             logger.debug(f"🐛 DEBUG: Dates: {instance.start_date} to {instance.end_date}")
#             logger.debug(f"🐛 DEBUG: Days requested: {instance.days_requested}")

# # Signal to handle leave balance updates
# @receiver(post_save, sender=LeaveRequest)
# def handle_leave_balance_updates(sender, instance, created, **kwargs):
#     """
#     Handle leave balance updates when leave status changes
#     """
#     try:
#         if not created:  # Only for updates, not new requests
#             previous_status = getattr(instance, '_previous_status', None)
#             current_status = instance.status
            
#             # Import here to avoid circular imports
#             from .services import LeaveBalanceService
            
#             # If leave was just approved, deduct from balance
#             if previous_status == 'PENDING' and current_status == 'APPROVED':
#                 try:
#                     LeaveBalanceService.deduct_leave_balance(instance)
#                     logger.info(f"✅ Leave balance deducted for approved leave: {instance.id}")
#                 except Exception as balance_error:
#                     logger.error(f"❌ Failed to deduct leave balance: {balance_error}")
            
#             # If approved leave was cancelled, restore balance
#             elif previous_status == 'APPROVED' and current_status == 'CANCELLED':
#                 try:
#                     LeaveBalanceService.restore_leave_balance(instance)
#                     logger.info(f"✅ Leave balance restored for cancelled leave: {instance.id}")
#                 except Exception as restore_error:
#                     logger.error(f"❌ Failed to restore leave balance: {restore_error}")
                    
#     except Exception as e:
#         logger.error(f"❌ Error in leave balance update handler: {e}")


from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import LeaveRequest
from .services import LeaveNotificationService, LeaveBalanceService
import logging

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=LeaveRequest)
def store_previous_status(sender, instance, **kwargs):
    """Store the previous status before saving to track status changes"""
    try:
        if instance.pk:
            old_instance = LeaveRequest.objects.get(pk=instance.pk)
            instance._previous_status = old_instance.status
            instance._previous_balance_deducted = old_instance.balance_deducted
            logger.debug(f"🔍 Previous status: {old_instance.status} -> {instance.status}")
        else:
            instance._previous_status = None
            instance._previous_balance_deducted = False
    except LeaveRequest.DoesNotExist:
        instance._previous_status = None
        instance._previous_balance_deducted = False

@receiver(post_save, sender=LeaveRequest)
def handle_leave_request_status_changes(sender, instance, created, **kwargs):
    """Handle leave request status changes and balance updates"""
    try:
        if created:
            # New leave request - only send notifications
            logger.info(f"📧 New leave request created: {instance.id} - {instance.employee.user.get_full_name()}")
            try:
                LeaveNotificationService.notify_leave_request_submitted(instance)
            except Exception as e:
                logger.error(f"❌ Notification failed: {e}")
            return

        # Handle status changes for existing requests
        previous_status = getattr(instance, '_previous_status', None)
        current_status = instance.status
        previous_balance_deducted = getattr(instance, '_previous_balance_deducted', False)

        if previous_status and previous_status != current_status:
            logger.info(f"🔄 Status change: {previous_status} -> {current_status} for leave {instance.id}")

            # Handle APPROVAL - Deduct balance only once
            if previous_status == 'PENDING' and current_status == 'APPROVED':
                logger.info(f"✅ Leave approved: {instance.id}")
                
                # Deduct balance only if not already deducted
                if not instance.balance_deducted and not previous_balance_deducted:
                    try:
                        LeaveBalanceService.deduct_leave_balance(instance)
                        logger.info(f"✅ Balance deducted for leave {instance.id}")
                    except Exception as e:
                        logger.error(f"❌ Balance deduction failed: {e}")
                else:
                    logger.info(f"ℹ️ Balance already deducted for leave {instance.id}")

                # Send notifications
                try:
                    LeaveNotificationService.notify_leave_approved(instance, instance.approved_by)
                except Exception as e:
                    logger.error(f"❌ Notification failed: {e}")

            # Handle REJECTION - No balance changes needed
            elif previous_status == 'PENDING' and current_status == 'REJECTED':
                logger.info(f"❌ Leave rejected: {instance.id}")
                try:
                    rejected_by = instance.approved_by or (instance.employee.manager.user if hasattr(instance.employee, 'manager') and instance.employee.manager else None)
                    rejection_reason = instance.rejection_reason or instance.manager_comments or 'No reason provided'
                    LeaveNotificationService.notify_leave_rejected(instance, rejected_by, rejection_reason)
                except Exception as e:
                    logger.error(f"❌ Notification failed: {e}")

            # Handle CANCELLATION - Restore balance if it was deducted
            elif current_status == 'CANCELLED':
                logger.info(f"🚫 Leave cancelled: {instance.id}")
                
                # Restore balance only if it was previously deducted
                if previous_status == 'APPROVED' and instance.balance_deducted:
                    try:
                        LeaveBalanceService.restore_leave_balance(instance)
                        logger.info(f"✅ Balance restored for cancelled leave {instance.id}")
                    except Exception as e:
                        logger.error(f"❌ Balance restoration failed: {e}")

                # Send notifications
                try:
                    LeaveNotificationService.notify_leave_cancelled(instance)
                except Exception as e:
                    logger.error(f"❌ Notification failed: {e}")

    except Exception as e:
        logger.error(f"❌ Error in leave status change handler: {e}")
        logger.exception("Full traceback:")