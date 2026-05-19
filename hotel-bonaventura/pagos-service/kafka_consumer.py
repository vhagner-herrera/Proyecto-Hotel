import os
import json
import uuid
import logging
from datetime import datetime
from kafka import KafkaConsumer
from database import get_db_connection
from boleta_generator import generar_datos_boleta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

KAFKA_BROKER = os.environ.get("KAFKA_BROKER", "localhost:9092")
TOPIC = "reserva-completada-topic"
GROUP_ID = "pagos-service-group"

def start_consumer():
    logger.info(f"🚀 Iniciando Kafka Consumer en {KAFKA_BROKER} para el topic {TOPIC}")
    
    try:
        consumer = KafkaConsumer(
            TOPIC,
            bootstrap_servers=KAFKA_BROKER.split(","),
            group_id=GROUP_ID,
            auto_offset_reset='earliest',
            value_deserializer=lambda x: json.loads(x.decode('utf-8')) if x else None
        )
        
        for message in consumer:
            event = message.value
            if not event:
                continue
            
            logger.info(f"📥 Evento recibido: Reserva {event.get('codigoReserva')} - Monto: S/ {event.get('montoTotal')}")
            try:
                procesar_pago_y_boleta(event)
                logger.info(f"✅ Pago y boleta generados para reserva {event.get('codigoReserva')}")
            except Exception as e:
                logger.error(f"❌ Error procesando pago para reserva {event.get('codigoReserva')}: {e}")
                
    except Exception as e:
        logger.error(f"❌ Error iniciando el consumer de Kafka: {e}")

def procesar_pago_y_boleta(event: dict):
    id_reserva = event.get('idReserva')
    monto_total = event.get('montoTotal')
    metodo_pago = event.get('metodoPago', 'TARJETA')
    
    pago_id = str(uuid.uuid4())
    ahora = datetime.now()
    
    # Generar datos de boleta
    boleta_data = generar_datos_boleta(event, pago_id)
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # 1. Insertar Pago
            cur.execute("""
                INSERT INTO hotel_pagos.pagos (id, id_reserva, monto, metodo_pago, fecha_pago, estado)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (pago_id, id_reserva, monto_total, metodo_pago, ahora, 'EXITOSO'))
            
            # 2. Insertar Boleta
            # Nota: el numero puede ser default o calculado por trigger, dejaremos que sea autogenerado o null
            cur.execute("""
                INSERT INTO hotel_pagos.boletas (
                    id, id_pago, id_reserva, serie, cliente_dni, cliente_nombre_completo,
                    base_imponible, igv, importe_total, estado, fecha_emision, documento_completo
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING numero
            """, (
                boleta_data['id'], boleta_data['idPago'], boleta_data['idReserva'], boleta_data['serie'],
                boleta_data['clienteDni'], boleta_data['clienteNombreCompleto'],
                boleta_data['baseImponible'], boleta_data['igv'], boleta_data['importeTotal'],
                boleta_data['estado'], boleta_data['fechaEmision'], json.dumps(boleta_data['documentoCompleto'])
            ))
            
            # Si hay un número retornado, lo actualizamos en memoria (opcional)
            result = cur.fetchone()
            if result:
                boleta_data['numero'] = result[0]
                
        conn.commit()
