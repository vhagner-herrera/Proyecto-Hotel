import io
import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from datetime import datetime

def generar_pdf_boleta(boleta_db: dict) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Parse documento_completo
    doc_completo = boleta_db.get("documento_completo", {})
    if isinstance(doc_completo, str):
        try:
            doc_completo = json.loads(doc_completo)
        except:
            doc_completo = {}
            
    boleta = doc_completo.get("boleta", {})
    if not boleta:
        # Fallback to direct db fields if boleta key is not found
        boleta = {
            "cliente": {"nombres": boleta_db.get("cliente_nombre_completo"), "numeroDocumento": boleta_db.get("cliente_dni")},
            "totales": {"baseImponible": boleta_db.get("base_imponible", 0.0), "igv": boleta_db.get("igv", 0.0), "importeTotal": boleta_db.get("importe_total", 0.0)},
            "empresa": {"razonSocial": "Hotel BonAventura S.A.C.", "direccion": "Av. Ejemplo 123, Lima, Perú", "ruc": "20123456789"},
            "reserva": {"habitacion": {"tipo": "Servicio de Alojamiento", "numero": ""}},
            "serie": boleta_db.get("serie", "B001"),
            "numero": boleta_db.get("numero", "PENDIENTE")
        }

    # Titulo y Encabezado
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, boleta.get("empresa", {}).get("nombreComercial", "HOTEL BONAVENTURA"))
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, boleta.get("empresa", {}).get("direccion", "Av. Ejemplo 123, Lima, Perú"))
    c.drawString(50, height - 85, f"RUC: {boleta.get('empresa', {}).get('ruc', '20123456789')}")
    
    # Cuadro de la Boleta (derecha)
    c.rect(width - 200, height - 100, 150, 60)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(width - 180, height - 60, "BOLETA ELECTRÓNICA")
    c.setFont("Helvetica", 12)
    numero = boleta_db.get("numero")
    numero_str = f"{numero:08d}" if numero else "PENDIENTE"
    c.drawString(width - 160, height - 80, f"{boleta.get('serie', 'B001')} - {numero_str}")

    # Datos del Cliente
    c.drawString(50, height - 130, f"Cliente: {boleta.get('cliente', {}).get('nombres', '')}")
    c.drawString(50, height - 150, f"DNI: {boleta.get('cliente', {}).get('numeroDocumento', '')}")
    fecha_emision = boleta.get("fechaEmision", datetime.now().isoformat())
    if isinstance(fecha_emision, str):
        fecha_emision = fecha_emision[:10] # solo YYYY-MM-DD
    c.drawString(50, height - 170, f"Fecha Emisión: {fecha_emision}")
    
    # Línea separadora
    c.line(50, height - 190, width - 50, height - 190)
    
    # Detalles
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 220, "Descripción")
    c.drawString(width - 150, height - 220, "Importe (S/)")
    
    c.setFont("Helvetica", 12)
    habitacion = boleta.get("reserva", {}).get("habitacion", {})
    desc = f"Servicio de Alojamiento - Hab. {habitacion.get('numero', '')} {habitacion.get('tipo', '')}"
    c.drawString(50, height - 240, desc)
    c.drawString(width - 150, height - 240, f"{boleta.get('totales', {}).get('valorVenta', 0.0):.2f}")
    
    # Totales
    c.line(50, height - 270, width - 50, height - 270)
    
    c.drawString(width - 250, height - 300, "Base Imponible:")
    c.drawString(width - 150, height - 300, f"{boleta.get('totales', {}).get('valorVenta', 0.0):.2f}")
    
    c.drawString(width - 250, height - 320, "IGV (18%):")
    c.drawString(width - 150, height - 320, f"{boleta.get('totales', {}).get('igv', 0.0):.2f}")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(width - 250, height - 350, "Total:")
    c.drawString(width - 150, height - 350, f"S/ {boleta.get('totales', {}).get('importeTotal', 0.0):.2f}")
    
    # Leyenda
    leyenda = boleta.get("leyenda", {}).get("descripcion", "")
    if leyenda:
        c.setFont("Helvetica", 10)
        c.drawString(50, height - 380, leyenda)
        
    # Hash y QR
    hash_txt = boleta.get("sunat", {}).get("codigoHash", "")
    if hash_txt:
        c.setFont("Helvetica-Oblique", 8)
        c.drawString(50, height - 400, f"Hash: {hash_txt}")

    # Pie de página
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(50, 50, "Gracias por su preferencia. Hotel BonAventura.")
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()
