import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DividasFinanciamentosService, DividaFinanciamento } from '../../services/dividasFinanciamentosService';
import { AuthService } from '../../services/authService';
import DividaCard from './DividaCard';
import DividaDetailPanel from './DividaDetailPanel';
import DividaFormModal from './DividaFormModal';

export default function DividasFinanciamentosPanel() {
  const [dividas, setDividas] = useState<DividaFinanciamento[]>([]);
  const [selectedDivida, setSelectedDivida] = useState<DividaFinanciamento | null>(null);
  const [editingDivida, setEditingDivida] = useState<DividaFinanciamento | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = AuthService.getInstance().getCurrentUser();
    if (user?.user_id) {
      setUserId(user.user_id);
      loadDividas(user.user_id);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadDividas = async (uid: string) => {
    setIsLoading(true);
    const data = await DividasFinanciamentosService.getAll(uid);
    setDividas(data);
    setIsLoading(false);
  };

  const handleViewDetails = (id: string) => {
    const divida = dividas.find((d) => d.id === id);
    if (divida) {
      setSelectedDivida(divida);
      setIsDetailOpen(true);
    }
  };

  const handleEdit = (id: string) => {
    const divida = dividas.find((d) => d.id === id);
    if (divida) {
      console.log('✏️ Editar dívida:', divida);
      setEditingDivida(divida);
      setIsFormOpen(true);
    }
  };

  const handleLiquidar = async (id: string) => {
    if (!userId) return;
    const success = await DividasFinanciamentosService.liquidar(id);
    if (success) {
      await loadDividas(userId);
      if (isDetailOpen) {
        setIsDetailOpen(false);
        setSelectedDivida(null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    const success = await DividasFinanciamentosService.delete(id);
    if (success) {
      await loadDividas(userId);
      if (isDetailOpen) {
        setIsDetailOpen(false);
        setSelectedDivida(null);
      }
    }
  };

  const handleFormSubmit = async (formData: Partial<DividaFinanciamento>) => {
    if (!userId) return;

    // Se estiver editando, atualiza
    if (editingDivida) {
      const updated = await DividasFinanciamentosService.update(editingDivida.id, formData);
      if (updated) {
        await loadDividas(userId);
        setIsFormOpen(false);
        setEditingDivida(null);
      }
    } else {
      // Senão, cria novo
      const dividaData = {
        ...formData,
        user_id: userId,
      } as Omit<DividaFinanciamento, 'id' | 'created_at' | 'updated_at'>;

      const newDivida = await DividasFinanciamentosService.create(dividaData);
      if (newDivida) {
        await loadDividas(userId);
        setIsFormOpen(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dívidas e Financiamentos</h1>
        </div>
        <button
          onClick={() => {
            setEditingDivida(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#00A651] hover:bg-[#008c44] text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova dívida/financiamento
        </button>
      </div>

      {/* Cards Grid */}
      {dividas.length > 0 && (
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
      )}

      {/* Empty State */}
      {dividas.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">Nenhuma dívida ou financiamento cadastrado</p>
          <button
            onClick={() => {
              setEditingDivida(null);
              setIsFormOpen(true);
            }}
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
        onClose={() => {
          setIsFormOpen(false);
          setEditingDivida(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDivida}
      />
    </div>
  );
}
