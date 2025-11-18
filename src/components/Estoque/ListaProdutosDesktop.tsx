// src/components/Estoque/ListaProdutosDesktop.tsx
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

export default function ListaProdutosDesktop({
  produtos,
  getCategoryIcon,
  setHistoryModal,
  setRemoveModal,
}: Props) {
  return (
    <div className="hidden md:block bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[rgba(0,68,23,0.08)] overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-6 py-5 border-b border-[rgba(0,68,23,0.08)]">
        <h3 className="text-[16px] font-bold text-[#004417]">Produtos em Estoque</h3>
      </div>

      {/* Lista */}
      <div className="divide-y divide-[rgba(0,68,23,0.08)]">
        {produtos.map((item) => (
          <div
            key={item.nome}
            className="relative flex flex-col md:flex-row md:items-center gap-4 p-6 hover:bg-[rgba(0,68,23,0.02)] transition-all hover:scale-[1.005]"
          >
            {/* 1) ÍCONE */}
            <div className="w-12 h-12 flex items-center justify-center bg-[rgba(0,68,23,0.05)] rounded-xl">
              {getCategoryIcon(item.categorias[0] || '')}
            </div>

            {/* 2) NOME / CATEGORIA */}
            <div className="flex-1 min-w-0">
              <h4 className="text-[15px] font-bold text-[#004417] truncate mb-1">
                {item.nome}
              </h4>
              <span className="inline-block text-[12px] font-medium px-2 py-0.5 bg-[rgba(0,166,81,0.1)] text-[#00A651] rounded-xl">
                {item.categorias.join(', ')}
              </span>
            </div>

            {/* 3) QUANTIDADE / VALOR MÉDIO */}
            <div className="flex gap-8 shrink-0">
              <div>
                <p className="text-[13px] text-[rgba(0,68,23,0.6)] mb-0.5">Quantidade</p>
                <p className="text-[15px] font-semibold text-[#004417]">
                  {item.totalEstoqueDisplay.toFixed(2)} <span className="text-[13px] text-[rgba(0,68,23,0.7)]">{formatUnitFull(item.unidadeDisplay)}</span>
                </p>
              </div>
              <div>
                <p className="text-[13px] text-[rgba(0,68,23,0.6)] mb-0.5">Valor Médio</p>
                <p className="text-[15px] font-bold text-[#004417]">
                  {item.mediaPrecoDisplay != null && item.unidadeValorOriginal
                    ? `${formatSmartCurrency(Number(item.mediaPrecoDisplay))} / ${formatUnitFull(item.unidadeValorOriginal)}`
                    : "—"}            
                </p>
              </div>
            </div>

            {/* 4) BOTÕES */}
            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setHistoryModal({ isOpen: true, product: item })}
                className="px-3 py-2 bg-[rgba(0,68,23,0.05)] text-[#004417] hover:bg-[rgba(0,166,81,0.12)] rounded-lg text-[13px] font-medium transition-all"
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
                className="px-3 py-2 bg-[rgba(242,92,92,0.1)] text-[#F25C5C] hover:bg-[rgba(242,92,92,0.15)] rounded-lg text-[13px] font-medium transition-all"
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
