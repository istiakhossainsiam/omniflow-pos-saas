import uvicorn
import socket
import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def ensure_ssl_certificates(ip):
    cert_file = os.path.join(os.path.dirname(__file__), "cert.pem")
    key_file = os.path.join(os.path.dirname(__file__), "key.pem")
    
    if os.path.exists(cert_file) and os.path.exists(key_file):
        return cert_file, key_file

    try:
        import datetime
        import ipaddress
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization

        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, 'BD'),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, 'OmniFlow POS'),
            x509.NameAttribute(NameOID.COMMON_NAME, 'OmniFlow Local SSL')
        ])

        san_list = [
            x509.DNSName('localhost'),
            x509.IPAddress(ipaddress.IPv4Address('127.0.0.1'))
        ]
        try:
            san_list.append(x509.IPAddress(ipaddress.IPv4Address(ip)))
        except Exception:
            pass

        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.now(datetime.timezone.utc)
        ).not_valid_after(
            datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName(san_list),
            critical=False
        ).sign(key, hashes.SHA256())

        with open(key_file, 'wb') as f:
            f.write(key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ))

        with open(cert_file, 'wb') as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))

        return cert_file, key_file
    except Exception as e:
        return None, None

if __name__ == "__main__":
    ip = get_local_ip()
    port = 8000
    
    # Check if --ssl flag is passed
    enable_ssl = "--ssl" in sys.argv

    ssl_kwargs = {}
    if enable_ssl:
        cert_file, key_file = ensure_ssl_certificates(ip)
        if cert_file and key_file:
            ssl_kwargs["ssl_keyfile"] = key_file
            ssl_kwargs["ssl_certfile"] = cert_file
            protocol = "https"
        else:
            protocol = "http"
    else:
        protocol = "http"

    print("\n" + "=" * 65)
    print(" [OMNIFLOW] Multi-Tenant Cloud POS & ERP SaaS Engine")
    print("=" * 65)
    print(f" [Web & Mobile Access] -> {protocol}://{ip}:{port}")
    print(f" [Local PC Browser]    -> {protocol}://localhost:{port}")
    print(f" [Swagger API Docs]    -> {protocol}://localhost:{port}/docs")
    print("-" * 65)
    print(" [DEMO LOGIN ACCOUNTS] (Password: password123):")
    print("  * Store Owner:       owner@vogue.com          (Code: VOGUE-HQ-OWN-001)")
    print("  * Store Manager:     manager.dhanmondi@vogue.com (PIN: 1234)")
    print("  * Cashier:           cashier.dhanmondi@vogue.com (Code: VOGUE-DHK01-CSH-001)")
    print("  * Senior Salesman:   sales.dhanmondi@vogue.com   (Code: VOGUE-DHK01-SLS-001)")
    print("=" * 65)
    if not enable_ssl:
        print(" [INFO] Running in standard HTTP mode.")
        print("        To run with HTTPS SSL, run: python start.py --ssl")
    print("=" * 65 + "\n")

    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True, 
        app_dir=backend_dir,
        **ssl_kwargs
    )
