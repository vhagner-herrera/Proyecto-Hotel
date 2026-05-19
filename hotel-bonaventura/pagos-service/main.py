import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from database import get_db_connection
from kafka_consumer import start_consumer, procesar_pago_y_boleta
from pdf_generator import generar_pdf_boleta

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Iniciar consumer de Kafka en un thread de background
    thread = threading.Thread(target=start_consumer, daemon=True)
    thread.start()
    yield
    # Limpiar recursos si es necesario

app = FastAPI(title="Pagos Service", lifespan=lifespan)

# --- RUTAS DE COMPATIBILIDAD (Health Check) ---
@app.get("/actuator/health")
def health_check():
    return {"status": "UP"}

@app.get("/actuator/info")
def info():
    return {"app": {"name": "pagos-service"}}

# --- RUTAS DE PAGOS ---

def dict_from_row(cursor, row):
    if not row:
        return None
    return dict(zip([col[0] for col in cursor.description], row))

@app.get("/api/pagos")
def listar_pagos():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM hotel_pagos.pagos")
            rows = cur.fetchall()
            return [dict_from_row(cur, row) for row in rows]

@app.get("/api/pagos/{id}")
def obtener_pago(id: str):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM hotel_pagos.pagos WHERE id = %s", (id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Pago no encontrado")
            return dict_from_row(cur, row)

@app.get("/api/pagos/reserva/{id_reserva}")
def obtener_pago_por_reserva(id_reserva: str):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM hotel_pagos.pagos WHERE id_reserva = %s", (id_reserva,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Pago no encontrado para reserva")
            return dict_from_row(cur, row)

@app.post("/api/pagos/simular")
def simular_pago(event: Dict[str, Any]):
    # Mismo flujo que el consumer pero sincrónico
    procesar_pago_y_boleta(event)
    # Devolvemos la boleta generada
    id_reserva = event.get('idReserva')
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM hotel_pagos.boletas WHERE id_reserva = %s", (id_reserva,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Boleta no generada en la simulación")
            boleta = dict_from_row(cur, row)
            return boleta

# --- RUTAS DE BOLETAS ---

@app.get("/api/pagos/boletas/{id}")
def obtener_boleta(id: str):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM hotel_pagos.boletas WHERE id = %s", (id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Boleta no encontrada")
            return dict_from_row(cur, row)

@app.get("/api/pagos/boletas/reserva/{id_reserva}")
def obtener_boleta_por_reserva(id_reserva: str):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM hotel_pagos.boletas WHERE id_reserva = %s", (id_reserva,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Boleta no encontrada para reserva")
            return dict_from_row(cur, row)

@app.get("/api/pagos/boletas/{id}/pdf")
def descargar_pdf(id: str):
    boleta = obtener_boleta(id)
    pdf_bytes = generar_pdf_boleta(boleta)
    
    serie = boleta.get('serie', 'B001')
    numero = boleta.get('numero') or 0
    filename = f"boleta-{serie}-{numero:08d}.pdf"
    
    headers = {
        'Content-Disposition': f'inline; filename="{filename}"'
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
