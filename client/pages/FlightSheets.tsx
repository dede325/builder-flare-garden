import { FileText } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function FlightSheets() {
  return (
    <PlaceholderPage
      title="Folhas de Voo"
      description="Documentação completa de voos com registro de rotas, tempos de voo, combustível, tripulação e observações operacionais."
      icon={FileText}
    />
  );
}
