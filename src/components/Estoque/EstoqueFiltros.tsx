import { useState } from "react";
import { Filter, ChevronDown, Search as SearchIcon } from "lucide-react";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  categoria: string;
  setCategoria: (v: string) => void;
  ordem: string;
  setOrdem: (v: string) => void;
  ordemDirecao: "asc" | "desc";
  setOrdemDirecao: (v: "asc" | "desc") => void;
}

export default function EstoqueFiltros({
  search,
  setSearch,
  categoria,
  setCategoria,
  ordem,
  setOrdem,
  ordemDirecao,
  setOrdemDirecao,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);

  // Label bonito para exibir no botão
  const getFilterLabel = () => {
    if (search) return `Nome contém "${search}"`;
    if (categoria) return `Categoria: ${categoria}`;
    if (ordem === "alfabetica") return "Ordem Alfabética";
    if (ordem === "dataLancamento") return "Data de Lançamento";
    if (ordem === "validade") return "Validade";
    return "Nenhum filtro aplicado";
  };

  return (
    <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,68,23,0.10)] p-5 md:p-6">
      {/* Cabeçalho do filtro */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-[rgba(0,166,81,0.08)] rounded-xl flex items-center justify-center">
            <Filter className="w-5 h-5 text-[#00A651]" />
          </div>
          <h3 className="text-[16px] font-semibold text-[#004417]">Filtros de Estoque</h3>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 bg-white hover:bg-[rgba(0,166,81,0.04)] rounded-[12px] transition-all"
        >
          <span className="text-sm font-medium text-[#004417]">{getFilterLabel()}</span>
          <ChevronDown
            className={`w-4 h-4 text-[#00A651] transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Opções de filtro */}
      {showFilters && (
        <div className="space-y-4">
          {/* 🔎 Filtro por nome */}
          <div className="flex items-center gap-2">
            <SearchIcon className="w-4 h-4 text-[#00A651]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="flex-1 px-4 py-2 rounded-[12px] bg-white shadow-[0_1px_3px_rgba(0,68,23,0.06)] appearance-none placeholder:text-[rgba(0,166,81,0.45)] text-[#004417]"
            />
          </div>

          {/* 🏷️ Filtro por categoria */}
          <div>
            <label className="block text-[13px] font-medium text-[#004417] mb-1">
              Categoria
            </label>
            <div className="relative">
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-4 py-2 rounded-[12px] bg-white text-[#004417] appearance-none shadow-[0_1px_3px_rgba(0,68,23,0.06)]"
              >
              <option value="">Todas as categorias</option>
              <option value="Fertilizante">Fertilizante</option>
              <option value="Corretivo">Corretivo</option>
              <option value="Herbicida">Herbicida</option>
              <option value="Inseticida">Inseticida</option>
              <option value="Fungicida">Fungicida</option>
              <option value="Foliar/Nutricional">Foliar/Nutricional</option>
              <option value="Adjuvante/Óleo">Adjuvante/Óleo</option>
              <option value="Outro">Outro</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#00A651] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 📑 Ordenação */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-[#004417] mb-1">
                Ordenar por
              </label>
              <div className="relative">
                <select
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value)}
                  className="w-full px-4 py-2 rounded-[12px] bg-white text-[#004417] appearance-none shadow-[0_1px_3px_rgba(0,68,23,0.06)]"
                >
                <option value="">Sem ordenação</option>
                <option value="alfabetica">Ordem Alfabética</option>
                <option value="dataLancamento">Data de Lançamento</option>
                <option value="validade">Validade</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#00A651] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#004417] mb-1">
                Direção
              </label>
              <div className="relative">
                <select
                  value={ordemDirecao}
                  onChange={(e) =>
                    setOrdemDirecao(e.target.value as "asc" | "desc")
                  }
                  className="w-full px-4 py-2 rounded-[12px] bg-white text-[#004417] appearance-none shadow-[0_1px_3px_rgba(0,68,23,0.06)]"
                >
                  <option value="asc">Crescente</option>
                  <option value="desc">Decrescente</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#00A651] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
