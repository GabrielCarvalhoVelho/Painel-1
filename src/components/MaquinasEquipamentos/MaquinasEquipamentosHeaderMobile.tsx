import { formatCurrency } from '../../lib/currencyFormatter';

interface Props {
  numeroMaquinas: number;
  custoTotal: number;
  onOpenModal: () => void;
}

export default function MaquinasEquipamentosHeaderMobile({ numeroMaquinas, custoTotal, onOpenModal }: Props) {
  return (
    <div className="block md:hidden px-4">
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,68,23,0.08)] border border-[rgba(0,68,23,0.08)] p-4">
        <div className="mb-4">
          <h2 className="text-[18px] font-bold text-[#004417]">Máquinas e Equipamentos</h2>
          <p className="text-[13px] text-[rgba(0,68,23,0.7)]">Controle de máquinas e equipamentos da fazenda</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-[rgba(0,68,23,0.03)] p-4 rounded-xl text-center transition-transform active:scale-[0.98]">
            <p className="text-[13px] text-[rgba(0,68,23,0.7)] mb-1">Total de Máquinas</p>
            <p className="text-[22px] font-bold text-[#004417]">{numeroMaquinas}</p>
          </div>

          <div className="bg-[rgba(202,219,42,0.12)] p-4 rounded-xl text-center transition-transform active:scale-[0.98]">
            <p className="text-[13px] text-[rgba(0,68,23,0.7)] mb-1">Valor Total</p>
            <p className="text-[22px] font-bold text-[#004417]">
              {formatCurrency(custoTotal)}
            </p>
          </div>

          <div className="bg-[rgba(0,68,23,0.03)] p-4 rounded-xl border-2 border-dashed border-[rgba(0,68,23,0.25)] active:bg-[rgba(0,166,81,0.12)] transition-all">
            <button
              onClick={onOpenModal}
              className="w-full h-[60px] text-[#004417] font-bold flex items-center justify-center gap-2"
            >
              <span className="text-[#00A651] text-xl">➕</span>
              Cadastrar Máquinas e Equipamentos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
