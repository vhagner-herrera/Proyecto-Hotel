import Card from '../common/Card';
import Button from '../common/Button';

export default function ConfirmacionReserva({ reserva, onConfirmar, onCancelar }) {
  return (
    <Card title="Confirmar reserva">
      <p>Habitación: {reserva?.habitacion}</p>
      <p>Huésped: {reserva?.huesped}</p>
      <div>
        <Button onClick={onConfirmar}>Confirmar</Button>
        <Button variant="secondary" onClick={onCancelar}>Cancelar</Button>
      </div>
    </Card>
  );
}
