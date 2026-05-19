import Input from '../common/Input';
import Button from '../common/Button';

export default function FormularioCheckin({ onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <Input label="Nombre huésped" name="nombre" required />
      <Input label="Documento" name="documento" required />
      <Input label="Fecha entrada" name="fechaEntrada" type="date" required />
      <Input label="Fecha salida" name="fechaSalida" type="date" required />
      <Button type="submit">Confirmar check-in</Button>
    </form>
  );
}
