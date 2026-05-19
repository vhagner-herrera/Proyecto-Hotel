import Card from '../common/Card';

export default function HabitacionCard({ habitacion, onSeleccionar }) {
  return (
    <Card className="habitacion-card">
      <p>N° {habitacion.numero} — {habitacion.tipo}</p>
      <p>Estado: {habitacion.estado}</p>
      <button onClick={() => onSeleccionar(habitacion)}>Seleccionar</button>
    </Card>
  );
}
