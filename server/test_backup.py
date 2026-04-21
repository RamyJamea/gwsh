# test_backup.py
import sys
import os

# Set up path so we can import the server's modules without relative path issues
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from server.services.backup_service import send_backup_email
from server.core.config import get_settings

def run_test():
    settings = get_settings()
    if not settings.BACKUP_SENDER_EMAIL or 'your.email' in settings.BACKUP_SENDER_EMAIL:
        print("\nERROR: Please update your .env file with actual Gmail credentials first!\n")
        print("Variables to update:")
        print("  BACKUP_SENDER_EMAIL")
        print("  BACKUP_SENDER_PASSWORD")
        print("  BACKUP_RECIPIENT_EMAIL")
        sys.exit(1)
        
    print(f"Testing database email backup to {settings.BACKUP_RECIPIENT_EMAIL}...")
    try:
        send_backup_email()
        print("Test complete. Check your inbox.")
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    run_test()
