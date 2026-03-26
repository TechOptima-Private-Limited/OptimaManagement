import ipaddress
import re

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from attendance import views as attendance_views


_IPV4_RE = re.compile(r"(?:(?:\d{1,3})\.){3}\d{1,3}")
_ISO_DATE_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")


def _extract_ipv4(text: str) -> str | None:
    if not text:
        return None
    match = _IPV4_RE.search(text)
    if not match:
        return None
    candidate = match.group(0)
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return None


def _extract_date(text: str) -> str | None:
    if not text:
        return None
    match = _ISO_DATE_RE.search(text)
    if not match:
        return None
    return match.group(1)


def _safe_exec_tool(user, tool_name: str, arguments: dict):
    """
    Execute a whitelisted internal action by calling existing DRF views.
    This keeps the business logic and permission checks in one place.
    """
    factory = APIRequestFactory()

    if tool_name == "pending_edits":
        req = factory.get("/api/attendance/pending-edits/")
        force_authenticate(req, user=user)
        resp = attendance_views.get_pending_edits(req)
        return {"status_code": resp.status_code, "data": resp.data}

    if tool_name == "approve_edit":
        record_id = arguments.get("record_id")
        action = arguments.get("action")
        new_data = arguments.get("new_data") or {}

        req = factory.post(
            f"/api/attendance/approve-edit/{record_id}/",
            {"action": action, "new_data": new_data},
            format="json",
        )
        force_authenticate(req, user=user)
        resp = attendance_views.approve_edit(req, record_id=record_id)
        return {"status_code": resp.status_code, "data": resp.data}

    if tool_name == "sync_biometric_logs":
        device_ip = arguments.get("device_ip")
        sync_date = arguments.get("sync_date")

        payload = {"device_ip": device_ip}
        if sync_date:
            payload["sync_date"] = sync_date

        req = factory.post("/api/attendance/biometric/sync/", payload, format="json")
        force_authenticate(req, user=user)
        resp = attendance_views.sync_biometric_logs(req)
        return {"status_code": resp.status_code, "data": resp.data}

    if tool_name == "fetch_biometric_logs":
        device_ip = arguments.get("device_ip")
        fetch_date = arguments.get("fetch_date")

        payload = {"device_ip": device_ip}
        if fetch_date:
            payload["fetch_date"] = fetch_date

        req = factory.post("/api/attendance/biometric/fetch/", payload, format="json")
        force_authenticate(req, user=user)
        resp = attendance_views.fetch_biometric_logs(req)
        return {"status_code": resp.status_code, "data": resp.data}

    if tool_name == "attendance_today":
        # AttendanceRecordListView is permission/scoping aware.
        today = timezone.now().date().isoformat()
        req = factory.get("/api/attendance/records/", {"start_date": today, "end_date": today})
        force_authenticate(req, user=user)
        resp = attendance_views.AttendanceRecordListView.as_view()(req)
        return {"status_code": resp.status_code, "data": resp.data}

    raise ValueError(f"Unsupported tool: {tool_name}")


def _infer_tool_from_message(message: str):
    """
    Basic intent extraction so the endpoint works even without an LLM.
    Frontend can also pass an explicit `tool` object.
    """
    text = (message or "").strip().lower()
    if not text:
        return None, None

    if ("pending" in text and "edit" in text) or ("pending edits" in text):
        return "pending_edits", {}

    if "biometric" in text and ("sync" in text or "syncing" in text):
        return "sync_biometric_logs", {}

    if "biometric" in text and ("fetch" in text or "preview" in text or "log" in text):
        return "fetch_biometric_logs", {}

    # Attendance (your own check-in/out for today)
    if (
        ("today" in text or "current" in text)
        and (
            "check in" in text
            or "check-in" in text
            or "checked in" in text
            or "enter" in text
            or "office" in text
        )
    ):
        return "attendance_today", {}

    if ("approve" in text or "reject" in text) and ("edit" in text or "attendance" in text):
        return "approve_edit", {}

    return None, None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def copilot_chat(request):
    """
    Request payload:
      - message (string)
      - tool (optional):
          {
            "name": "pending_edits" | "attendance_today" | "approve_edit" | "sync_biometric_logs" | "fetch_biometric_logs",
            "arguments": { ... }
          }
    """
    message = request.data.get("message", "")
    tool = request.data.get("tool")
    arguments = request.data.get("arguments") or {}

    if tool and isinstance(tool, dict):
        tool_name = tool.get("name")
        arguments = tool.get("arguments") or {}
    else:
        tool_name = None

    # If tool was not explicitly requested, infer from message.
    if not tool_name:
        inferred_tool, _ = _infer_tool_from_message(message)
        tool_name = inferred_tool

        if tool_name == "sync_biometric_logs":
            device_ip = _extract_ipv4(message)
            sync_date = _extract_date(message)
            arguments = {"device_ip": device_ip, "sync_date": sync_date}

        if tool_name == "fetch_biometric_logs":
            device_ip = _extract_ipv4(message)
            fetch_date = _extract_date(message)
            arguments = {"device_ip": device_ip, "fetch_date": fetch_date}

        if tool_name == "approve_edit":
            # Try to find a record id after "record" / "id" / "#"
            record_id_match = re.search(r"(?:record|id|#)\s*(\d+)", message.lower())
            if record_id_match:
                record_id = int(record_id_match.group(1))
            else:
                # fallback to first/last integer in string
                ints = re.findall(r"\d+", message)
                record_id = int(ints[-1]) if ints else None

            action = "reject" if "reject" in message.lower() else "approve"
            arguments = {"record_id": record_id, "action": action, "new_data": {}}

    if tool_name == "pending_edits":
        try:
            result = _safe_exec_tool(request.user, tool_name, arguments)
            status_code = result.get("status_code")
            if status_code != 200:
                err = result.get("data") or {}
                detail = err.get("detail") if isinstance(err, dict) else None
                msg = detail or "Unable to fetch pending edits."
                return Response(
                    {"reply": msg, "intent": tool_name, "tool_result": result},
                    status=status_code or status.HTTP_400_BAD_REQUEST,
                )

            records = result.get("data") if isinstance(result.get("data"), list) else []
            count = len(records)
            reply = (
                "You have no pending attendance edits."
                if count == 0
                else f"You have {count} pending attendance edit(s)."
            )
            return Response(
                {"reply": reply, "intent": tool_name, "tool_result": result, "records": records},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response({"reply": f"Failed to fetch pending edits: {e}", "intent": tool_name}, status=500)

    if tool_name == "attendance_today":
        try:
            result = _safe_exec_tool(request.user, tool_name, arguments)
            status_code = result.get("status_code")
            if status_code != 200:
                err = result.get("data") or {}
                detail = err.get("detail") if isinstance(err, dict) else None
                msg = detail or "Unable to fetch today's attendance."
                return Response(
                    {"reply": msg, "intent": tool_name, "tool_result": result},
                    status=status_code or status.HTTP_400_BAD_REQUEST,
                )

            payload = result.get("data")
            # DRF list view typically returns a list when pagination_class=None
            records = payload.get("results") if isinstance(payload, dict) else payload
            records = records if isinstance(records, list) else []

            if not records:
                reply = "I couldn't find an attendance record for today."
            else:
                # Pick the latest (AttendanceRecordListView returns order_by('-date'))
                r = records[0] if records else {}
                check_in = r.get("check_in_time")
                check_out = r.get("check_out_time")
                if check_in and check_out:
                    reply = f"Today you entered the office at {check_in} and checked out at {check_out}."
                elif check_in:
                    reply = f"Today you entered the office at {check_in}. You haven't checked out yet."
                else:
                    reply = "I found today's attendance record, but no check-in time is available."

            return Response(
                {"reply": reply, "intent": tool_name, "tool_result": result},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"reply": f"Failed to fetch today's attendance: {e}", "intent": tool_name},
                status=500,
            )

    if tool_name in {"approve_edit", "sync_biometric_logs", "fetch_biometric_logs"}:
        missing = []
        if tool_name == "approve_edit":
            if not arguments.get("record_id"):
                missing.append("record_id")
            if arguments.get("action") not in {"approve", "reject"}:
                missing.append("action")
        if tool_name in {"sync_biometric_logs", "fetch_biometric_logs"}:
            if not arguments.get("device_ip"):
                missing.append("device_ip")

        if missing:
            return Response(
                {
                    "reply": f"Missing required info for `{tool_name}`: {', '.join(missing)}.",
                    "intent": tool_name,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = _safe_exec_tool(request.user, tool_name, arguments)
            status_code = result.get("status_code")
            if status_code and status_code >= 400:
                err = result.get("data") or {}
                detail = err.get("detail") if isinstance(err, dict) else None
                msg = detail or "That action could not be completed."
                return Response(
                    {"reply": msg, "intent": tool_name, "tool_result": result},
                    status=status_code,
                )

            return Response(
                {"reply": f"Done. Tool `{tool_name}` executed.", "intent": tool_name, "tool_result": result},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"reply": f"Failed to execute `{tool_name}`: {e}", "intent": tool_name},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # No recognized intent/tool.
    return Response(
        {
            "reply": (
                "I can help with these Copilot actions right now:\n"
                "- Pending attendance edits\n"
                "- Your attendance for today (check-in/check-out time)\n"
                "- Approve/reject an attendance edit (provide the record id)\n"
                "- Biometric log preview (device_ip, optional date)\n"
                "- Biometric sync to attendance records (device_ip, optional date)\n\n"
                "Try: `pending edits`, `today check in time`, or `sync biometric 192.168.1.10 2026-03-25`."
            ),
            "intent": None,
        },
        status=status.HTTP_200_OK,
    )

