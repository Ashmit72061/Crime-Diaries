import pika
import json
import os
from dotenv import load_dotenv
from generator import generate_report
from sqlalchemy import text
from db import engine
from datetime import datetime

# Load .env from backend folder for developer convenience, fallback to current folder
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../backend/.env'))
load_dotenv()

def mark_job_failed(job_id, error_message):
    try:
        with engine.begin() as conn:
            conn.execute(
                text("UPDATE report_jobs SET status='FAILED', error_message=:msg, updated_at=:now WHERE id=:id"),
                {'msg': error_message, 'now': datetime.now().isoformat(), 'id': job_id}
            )
        print(f"[Worker] Marked job {job_id} as FAILED in database.")
    except Exception as e:
        print(f"[WorkerError] Failed to mark job as failed: {e}")

def on_message(channel, method, properties, body):
    try:
        payload = json.loads(body)
    except Exception as parse_err:
        print(f"[Worker] Invalid JSON payload received: {parse_err}")
        channel.basic_ack(delivery_tag=method.delivery_tag)
        return

    job_id = payload.get('job_id')
    if not job_id:
        print("[Worker] Job ID missing from payload. Acknowledging and discarding.")
        channel.basic_ack(delivery_tag=method.delivery_tag)
        return

    print(f"[Worker] Received report job request for ID: {job_id}")
    try:
        generate_report(job_id)
        channel.basic_ack(delivery_tag=method.delivery_tag)
        print(f"[Worker] Job {job_id} processed and acknowledged.")
    except Exception as e:
        print(f"[ERROR] Job {job_id} failed: {e}")
        mark_job_failed(job_id, str(e))
        channel.basic_ack(delivery_tag=method.delivery_tag)

def start():
    rabbitmq_url = os.getenv('RABBITMQ_URL', 'amqp://pharos:pharos123@localhost:5672')
    print(f"[Worker] Connecting to RabbitMQ at: {rabbitmq_url}")
    
    try:
        conn = pika.BlockingConnection(pika.URLParameters(rabbitmq_url))
        ch = conn.channel()
        
        ch.exchange_declare(exchange='pharos', exchange_type='topic', durable=True)
        ch.queue_declare(queue='report-generation-queue', durable=True)
        ch.queue_bind(exchange='pharos', queue='report-generation-queue', routing_key='report.requested')
        
        ch.basic_qos(prefetch_count=1)
        ch.basic_consume(queue='report-generation-queue', on_message_callback=on_message)
        
        print("[INFO] Python worker waiting for report jobs...")
        ch.start_consuming()
    except Exception as conn_err:
        print(f"[Fatal] Worker RabbitMQ consumer crash: {conn_err}")

if __name__ == '__main__':
    start()
