import base64
import os
import json
try:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.backends import default_backend
    
    # Generate fresh VAPID keys
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    public_key = private_key.public_key()
    
    # Get raw bytes
    private_bytes = private_key.private_numbers().private_value.to_bytes(32, byteorder='big')
    # Uncompressed public key (starts with 0x04)
    public_bytes = public_key.public_bytes(
        serialization.Encoding.X962,
        serialization.PublicFormat.UncompressedPoint
    )
    
    # Base64 URL safe without padding
    def b64url(b):
        return base64.urlsafe_b64encode(b).decode('utf-8').rstrip('=')
    
    keys = {
        "public_key": b64url(public_bytes),
        "private_key": b64url(private_bytes)
    }
    
    with open('vapid_keys.json', 'w') as f:
        json.dump(keys, f, indent=4)
    
    print("SUCCESS: Keys saved to vapid_keys.json")
except ImportError:
    print("Error: 'cryptography' library is missing. Run 'pip install cryptography'")
