import { Plane } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

export default function Aircraft() {
  return (
    <PlaceholderPage
      title="Gerenciamento de Aeronaves"
      description="Sistema completo para cadastro, manutenção e acompanhamento de aeronaves. Inclui histórico de voos, inspeções, e documentação técnica."
      icon={Plane}
    />
  );
}
