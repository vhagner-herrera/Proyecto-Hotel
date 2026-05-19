import uuid
import json
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime

def calcular_totales(monto_total: float) -> tuple:
    """
    Calcula Base Imponible e IGV a partir de un monto total.
    IGV = 18%. Entonces MontoTotal = BaseImponible * 1.18
    """
    total = Decimal(str(monto_total))
    divisor = Decimal('1.18')
    
    base_imponible = (total / divisor).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    igv = total - base_imponible
    
    return float(base_imponible), float(igv), float(total)

def generar_datos_boleta(event: dict, id_pago: str) -> dict:
    base_imponible, igv, total = calcular_totales(event.get("montoTotal", 0.0))
    
    boleta_id = str(uuid.uuid4())
    ahora = datetime.now()
    
    doc_completo = {
        "boleta": {
            "tipoComprobante": "03",
            "serie": "B001",
            "numero": "PENDIENTE",
            "fechaEmision": ahora.isoformat(),
            "moneda": "PEN",
            "formaPago": {
                "condicion": "Contado",
                "medioPago": event.get("metodoPago", "TARJETA")
            },
            "empresa": {
                "ruc": "20123456789",
                "razonSocial": "Hotel BonAventura S.A.C.",
                "nombreComercial": "Hotel BonAventura",
                "direccion": "Av. Ejemplo 123, Lima, Perú",
                "ubigeo": "150101",
                "distrito": "Lima",
                "provincia": "Lima",
                "departamento": "Lima"
            },
            "cliente": {
                "tipoDocumento": "DNI",
                "numeroDocumento": event.get("clienteDocumento", ""),
                "nombres": event.get("clienteNombreCompleto", ""),
                "edad": event.get("clienteEdad", 0),
                "celular": event.get("clienteCelular", "")
            },
            "reserva": {
                "codigoReserva": event.get("codigoReserva", ""),
                "fechaCheckIn": event.get("fechaCheckin", ""),
                "fechaCheckOut": event.get("fechaCheckout", ""),
                "cantidadNoches": event.get("cantidadNoches", 1),
                "habitacion": {
                    "numero": event.get("numeroHabitacion", ""),
                    "tipo": event.get("tipoHabitacion", ""),
                    "precioPorNoche": float(event.get("precioPorNoche", 0.0))
                }
            },
            "totales": {
                "valorVenta": float(base_imponible),
                "opGravadas": float(base_imponible),
                "opExoneradas": 0.00,
                "opInafectas": 0.00,
                "igv": float(igv),
                "importeTotal": float(total)
            },
            "leyenda": {
                "codigo": "1000",
                "descripcion": f"SON {int(total)} Y {int(round((total - int(total)) * 100))}/100 SOLES"
            },
            "sunat": {
                "tipoOperacion": "0101",
                "codigoHash": "ABCD1234EFGH5678IJKL9012MNOP3456",
                "codigoQR": f"20123456789|03|B001|PENDIENTE|{igv}|{total}|{ahora.date()}|1|{event.get('clienteDocumento', '')}|"
            },
            "estado": "Emitida"
        }
    }

    return {
        "id": boleta_id,
        "idPago": id_pago,
        "idReserva": event.get("idReserva"),
        "serie": "B001",
        "numero": None,
        "clienteDni": event.get("clienteDocumento", "00000000"),
        "clienteNombreCompleto": event.get("clienteNombreCompleto", "CLIENTE"),
        "baseImponible": base_imponible,
        "igv": igv,
        "importeTotal": total,
        "estado": "EMITIDA",
        "fechaEmision": ahora.isoformat(),
        "documentoCompleto": doc_completo
    }
