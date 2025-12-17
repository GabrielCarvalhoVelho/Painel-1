import { useState } from 'react';
import { Plus } from 'lucide-react';
import { mockDividas, Divida } from './mockDividas';
import DividaCard from './DividaCard';
import DividaDetailPanel from './DividaDetailPanel';
import DividaFormModal from './DividaFormModal';

export default function DividasFinanciamentosPanel() {
  const [dividas, setDividas] = useState<Divida[]>(mockDividas);
  const [selectedDivida, setSelectedDivida] = useState<Divida | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleViewDetails = (id: number) => {
    const divida = dividas.find((d) => d.id === id);
    if (divida) {
      setSelectedDivida(divida);
      setIsDetailOpen(true);
      console.log('👁️ Ver detalhes da dívida:', id);
    }
  };

  const handleEdit = (id: number) => {
    console.log('✏️ Editar dívida:', id);
    // Em uma implementação real, abriria o formulário com dados preenchidos
    setIsFormOpen(true);
  };

  const handleLiquidar = (id: number) => {
    console.log('✅ Liquidar dívida:', id);
    // Em uma implementação real, alteraria o status para "Liquidada"
  };

  const handleDelete = (id: number) => {
    console.log('🗑️ Deletar dívida:', id);
    // Em uma implementação real, removeria a dívida
  };

  const handleFormSubmit = (formData: Partial<Divida>) => {
    console.log('💾 Nova dívida/financiamento cadastrado:', formData);
    // Em uma implementação real, adicionaria ao banco de dados
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dívidas e Financiamentos</h1>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00A651] hover:bg-[#008c44] text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova dívida/financiamento
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dividas.map((divida) => (
          <DividaCard
            key={divida.id}
            divida={divida}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onLiquidar={handleLiquidar}
          />
        ))}
      </div>

      {/* Empty State */}
      {dividas.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">Nenhuma dívida ou financiamento cadastrado</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-[#00A651] hover:bg-[#008c44] text-white rounded-lg font-medium transition-colors"
          >
            Cadastrar agora
          </button>
        </div>
      )}

      {/* Detail Panel */}
      <DividaDetailPanel
        divida={selectedDivida}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDivida(null);
        }}
        onEdit={handleEdit}
        onLiquidar={handleLiquidar}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <DividaFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
