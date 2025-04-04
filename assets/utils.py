# assets/utils.py
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from resource_management.utils import send_threaded_email
from .models import AssetType, Asset

def send_asset_assignment_notification(assignment):
    assets = assignment.assets.all()
    print(f"Sending assignment notification for {assignment.employee.username} with {assets.count()} assets: {list(assets)}")
    context = {
        'employee': assignment.employee.get_full_name() or assignment.employee.username,
        'assets': assets,
        'count': assets.count(),
    }

    try:
        html_message_employee = render_to_string('assets/asset_assigned.html', context)
        plain_message_employee = strip_tags(html_message_employee)
        send_threaded_email(
            subject=f"Asset Assignment Notification for {assignment.employee.username}",
            body=plain_message_employee,
            recipients=[assignment.employee.email],
            ticket_number=f"asset-assignment-{assignment.id}-employee",
            html_message=html_message_employee,
            is_reply=False
        )

        if assignment.manager_email:
            html_message_manager = render_to_string('assets/asset_assigned_manager.html', context)
            plain_message_manager = strip_tags(html_message_manager)
            send_threaded_email(
                subject=f"Asset Assignment Notification for {assignment.employee.username}",
                body=plain_message_manager,
                recipients=[assignment.manager_email],
                ticket_number=f"asset-assignment-{assignment.id}-manager",
                html_message=html_message_manager,
                is_reply=False
            )
    except Exception as e:
        print(f"Failed to send assignment notification: {e}")

def send_asset_return_report(assignment, cleared, performed_by):
    returns = assignment.returns.all()
    print(f"Sending return report for {assignment.employee.username} with {returns.count()} returns: {list(returns)}")
    context = {
        'employee': assignment.employee.get_full_name() or assignment.employee.username,
        'returns': returns,
        'cleared': cleared,
        'performed_by': performed_by.get_full_name() or performed_by.username,
    }

    try:
        html_message = render_to_string('assets/asset_return_report.html', context)
        plain_message = strip_tags(html_message)

        recipients = [assignment.manager_email] if assignment.manager_email else []
        returned_assets = [return_item.asset for return_item in returns]
        asset_team_emails = Asset.objects.filter(
            id__in=[asset.id for asset in returned_assets]
        ).values_list('asset_type__asset_team_email', flat=True).distinct()
        for email in asset_team_emails:
            if email:
                recipients.append(email)

        if not recipients:
            print("No recipients found for return report.")
            return

        send_threaded_email(
            subject=f"Asset Return Report for {assignment.employee.username}",
            body=plain_message,
            recipients=recipients,
            ticket_number=f"asset-return-{assignment.id}",
            html_message=html_message,
            is_reply=False
        )
    except Exception as e:
        print(f"Failed to send return report: {e}")

def fix_asset_status_inconsistencies():
    from .models import Asset, AssetAssignment
    all_assets = Asset.objects.all()
    fixed_count = 0
    
    for asset in all_assets:
        active_assignment_count = AssetAssignment.objects.filter(
            assets=asset,
            returns__isnull=True
        ).count()
        
        correct_status = 'ASSIGNED' if active_assignment_count > 0 else 'AVAILABLE'
        
        if asset.status != correct_status and asset.status not in ['DAMAGED', 'LOST']:
            old_status = asset.status
            asset.status = correct_status
            asset.save()
            fixed_count += 1
            print(f"Fixed asset {asset.asset_tag}: {old_status} → {correct_status}")
    
    return fixed_count

def fix_specific_asset(asset_tag):
    from .models import Asset, AssetAssignment
    
    try:
        asset = Asset.objects.get(asset_tag=asset_tag)
        print(f"Checking asset {asset_tag}")
        
        active_assignments = AssetAssignment.objects.filter(
            assets=asset,
            returns__isnull=True
        )
        
        if active_assignments.exists():
            print(f"Asset {asset_tag} is assigned to: {[a.employee.username for a in active_assignments]}")
            if asset.status != 'ASSIGNED':
                asset.status = 'ASSIGNED'
                asset.save()
                print(f"Updated {asset_tag} status to ASSIGNED")
            return {'status': 'assigned', 'count': active_assignments.count()}
        else:
            print(f"Asset {asset_tag} has no active assignments")
            if asset.status != 'AVAILABLE':
                asset.status = 'AVAILABLE'
                asset.save()
                print(f"Updated {asset_tag} status to AVAILABLE")
            return {'status': 'available', 'count': 0}
            
    except Asset.DoesNotExist:
        print(f"Asset {asset_tag} not found")
        return {'status': 'not_found'}
    except Exception as e:
        print(f"Error checking {asset_tag}: {e}")
        return {'status': 'error', 'message': str(e)}