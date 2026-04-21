import os
import smtplib
from email.message import EmailMessage
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

from ..core import get_settings

logger = logging.getLogger(__name__)

# Single scheduler instance
scheduler = AsyncIOScheduler()

def send_backup_email():
    """
    Reads the local gwsh.db file, attaches it to an email, 
    and sends it via Gmail SMTP.
    """
    settings = get_settings()
    
    sender_email = settings.BACKUP_SENDER_EMAIL
    sender_password = settings.BACKUP_SENDER_PASSWORD
    recipient_email = settings.BACKUP_RECIPIENT_EMAIL

    if not sender_email or not sender_password or not recipient_email:
        logger.warning("Backup skipped: Email credentials not fully configured in environment variables.")
        return

    # Determine DB path dynamically or hardcode the expected location
    # `gwsh.db` is located in the `server` directory (the parent of `services`)
    server_dir = os.path.dirname(os.path.dirname(__file__))
    db_path = os.path.join(server_dir, "gwsh.db")
    
    if not os.path.exists(db_path):
        logger.error(f"Backup failed: Database file not found at {db_path}")
        return

    try:
        # Construct the email
        msg = EmailMessage()
        date_str = datetime.now().strftime("%Y-%m-%d")
        msg['Subject'] = f"POS Database Backup: {date_str}"
        msg['From'] = sender_email
        msg['To'] = recipient_email
        
        msg.set_content(
            f"Please find attached the automated database backup for {date_str}.\n\n"
            "Keep this secure, as it contains order history and sensitive data."
        )

        # Attach the database file
        with open(db_path, "rb") as f:
            db_data = f.read()
            
        file_name = f"gwsh_backup_{date_str}.db"
        msg.add_attachment(
            db_data,
            maintype='application',
            subtype='octet-stream',
            filename=file_name
        )

        # Connect to Gmail SMTP and send
        logger.info(f"Connecting to Gmail SMTP to send backup to {recipient_email}...")
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
            
        logger.info("Backup email sent successfully!")

    except smtplib.SMTPAuthenticationError:
        logger.error("Backup failed: SMTP Authentication Error. Please check your App Password and Email.")
    except Exception as e:
        logger.error(f"Backup failed: An unexpected error occurred - {e}")


def init_scheduler():
    """
    Initializes the apscheduler to run the send_backup_email task daily.
    """
    settings = get_settings()
    
    hour = settings.BACKUP_TIME_HOUR
    minute = settings.BACKUP_TIME_MINUTE
    
    # We use a CronTrigger to run every Monday at the specified hour/minute
    trigger = CronTrigger(day_of_week='mon', hour=hour, minute=minute)
    
    # Add the job to the scheduler
    scheduler.add_job(
        send_backup_email,
        trigger=trigger,
        id="daily_email_backup",
        name="Daily Email Backup",
        replace_existing=True
    )
    
    logger.info(f"Scheduled Weekly Email Backup for every Monday at {hour:02d}:{minute:02d}.")
    scheduler.start()

def shutdown_scheduler():
    """
    Gracefully shuts down the scheduler.
    """
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shutdown complete.")
