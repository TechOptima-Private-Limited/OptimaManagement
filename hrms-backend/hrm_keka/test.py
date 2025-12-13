# from zk import ZK
# from datetime import datetime
# import requests  # Optional if pushing data to your Django API

# # Replace with your device IP and port
# DEVICE_IP = '192.168.1.180'
# DEVICE_PORT = 4370

# def fetch_attendance_logs():
#     zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=5, password=0, force_udp=False)
#     conn = None
#     try:
#         conn = zk.connect()
#         conn.disable_device()
#         attendance = conn.get_attendance()

#         for log in attendance:
#             user_id = log.user_id
#             timestamp = log.timestamp.isoformat()
#             print(f"User {user_id} at {timestamp}")

#             # Optional: Send to your Django backend
#             # requests.post("http://127.0.0.1:8000/api/attendance/", json={
#             #     "employee_id": user_id,
#             #     "timestamp": timestamp
#             # })

#         conn.enable_device()
#     except Exception as e:
#         print("Error:", e)
#     finally:
#         if conn:
#             conn.disconnect()

# if __name__ == "__main__":
#     fetch_attendance_logs()
