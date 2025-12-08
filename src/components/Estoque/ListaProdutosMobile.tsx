// src/components/Estoque/ListaProdutosMobile.tsx
import { ProdutoAgrupado } from '../../services/agruparProdutosService';
import { formatUnitFull } from '../../lib/formatUnit';
import { formatSmartCurrency } from '../../lib/currencyFormatter';

type ModalParams = {
  isOpen: boolean;
  product: ProdutoAgrupado | null;
  quantidade?: number;
  observacao?: string;
};

interface Props {
  produtos: ProdutoAgrupado[];
  getCategoryIcon: (categoria: string) => JSX.Element;
  setHistoryModal: (params: ModalParams) => void;
  setRemoveModal: (params: ModalParams) => void;
}

export default function ListaProdutosMobile({
  produtos,
  getCategoryIcon,
  setHistoryModal,
  setRemoveModal,
}: Props) {
  return (
    <div className="block md:hidden bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[rgba(0,68,23,0.08)] overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-4 py-4 border-b border-[rgba(0,68,23,0.08)]">
        <h3 className="text-[16px] font-bold text-[#004417]">Produtos em Estoque</h3>
      </div>

      {/* Lista */}
      <div className="divide-y divide-[rgba(0,68,23,0.08)]">
        {produtos.map((item) => (
          <div key={item.nome} className="p-4 space-y-3 active:bg-[rgba(0,68,23,0.02)] transition-all">
            {/* Cabeçalho: ícone + nome */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center bg-[rgba(0,68,23,0.05)] rounded-xl">
                {getCategoryIcon(item.categorias[0] || '')}
              </div>
              <div className="flex-1">
                <h4 className="text-[15px] font-bold text-[#004417] leading-tight">
                  {item.nome}
                </h4>
                <span className="inline-block text-[12px] font-medium px-2 py-0.5 bg-[rgba(0,166,81,0.1)] text-[#00A651] rounded-xl mt-1">
                  {item.categorias.join(', ')}
                </span>
              </div>
            </div>

            {/* Quantidade e Valor */}
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-[13px] text-[rgba(0,68,23,0.6)] mb-0.5">Qtd.</p>
                <p className="text-[15px] font-semibold text-[#004417]">
                  {item.totalEstoqueDisplay.toFixed(2)} <span className="text-[13px] text-[rgba(0,68,23,0.7)]">{formatUnitFull(item.unidadeDisplay)}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[13px] text-[rgba(0,68,23,0.6)] mb-0.5">Valor Méd.</p>
                <p className="text-[15px] font-bold text-[#004417]">
                  {item.mediaPrecoDisplay != null && item.unidadeValorOriginal
                    ? `${formatSmartCurrency(Number(item.mediaPrecoDisplay))} / ${formatUnitFull(item.unidadeValorOriginal)}`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setHistoryModal({ isOpen: true, product: item })}
                className="px-3 py-1.5 bg-[rgba(0,68,23,0.05)] text-[#004417] active:bg-[rgba(0,166,81,0.12)] rounded-lg text-[13px] font-medium transition-all"
              >
                Histórico
              </button>

              <button
                onClick={() =>
                  setRemoveModal({
                    isOpen: true,
                    product: item
                  })
                }
                className="px-3 py-1.5 bg-[rgba(242,92,92,0.1)] text-[#F25C5C] active:bg-[rgba(242,92,92,0.15)] rounded-lg text-[13px] font-medium transition-all"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
