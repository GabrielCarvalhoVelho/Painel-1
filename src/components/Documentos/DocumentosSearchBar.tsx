import { useState } from "react";
import { Search, Filter, ArrowUpDown, X } from "lucide-react";
import { Documento } from "./mockDocumentos";

interface DocumentosSearchBarProps {
  documentos: Documento[];
  onFilterChange: (filtered: Documento[]) => void;
}

type TipoDocumento =
  | "Cadastro / Registro da Fazenda"
  | "Certificação / Auditoria"
  | "Contrato"
  | "Laudo / Relatório"
  | "Trabalhista / Funcionário"
  | "Outro";

type OrdenacaoData = "alfabetica" | "recentes" | "antigos";

const TIPOS: TipoDocumento[] = [
  "Cadastro / Registro da Fazenda",
  "Certificação / Auditoria",
  "Contrato",
  "Laudo / Relatório",
  "Trabalhista / Funcionário",
  "Outro",
];

export default function DocumentosSearchBar({
  documentos,
  onFilterChange,
}: DocumentosSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<TipoDocumento | "">("");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoData>("alfabetica");
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = (
    search: string = searchTerm,
    type: TipoDocumento | "" = selectedType,
    ordem: OrdenacaoData = ordenacao
  ) => {
    let filtered = [...documentos];

    // Busca por título, tipo ou observação
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          (doc.titulo && doc.titulo.toLowerCase().includes(term)) ||
          (doc.tipo && doc.tipo.toLowerCase().includes(term)) ||
          (doc.observacao && doc.observacao.toLowerCase().includes(term)) ||
          (doc.safra && doc.safra.toLowerCase().includes(term)) ||
          (doc.tema && doc.tema.toLowerCase().includes(term))
      );
    }

    // Filtro por tipo
    if (type) {
      filtered = filtered.filter((doc) => doc.tipo === type);
    }

    // Ordenação por data
    if (ordem === "recentes") {
      filtered.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Mais recentes primeiro
      });
    } else if (ordem === "antigos") {
      filtered.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB; // Mais antigos primeiro
      });
    } else {
      // Alfabética (padrão)
      filtered.sort((a, b) => 
        (a.titulo || 'Documento sem título').localeCompare(
          b.titulo || 'Documento sem título', 
          'pt-BR', 
          { sensitivity: 'base' }
        )
      );
    }

    onFilterChange(filtered);
  };

  // Chamar applyFilters sempre que algum filtro muda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFilters(value, selectedType, ordenacao);
  };

  const handleTypeChange = (type: TipoDocumento | "") => {
    setSelectedType(type);
    applyFilters(searchTerm, type, ordenacao);
  };

  const handleOrdenacaoChange = (ordem: OrdenacaoData) => {
    setOrdenacao(ordem);
    applyFilters(searchTerm, selectedType, ordem);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setOrdenacao("alfabetica");
    applyFilters("", "", "alfabetica");
  };

  const hasActiveFilters = searchTerm.trim() || selectedType || ordenacao !== "alfabetica";

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, tipo ou descrição..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent outline-none text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
            hasActiveFilters
              ? "bg-[#00A651] text-white hover:bg-[#008c44]"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 text-xs bg-white text-[#00A651] rounded-full px-2 py-0.5">
              ativo
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Tipo de Documento */}
          <div>
            <label className="block text-sm font-medium text-[#004417] mb-2">
              Tipo de Documento
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTypeChange("")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedType === ""
                    ? "bg-[#00A651] text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Todos
              </button>
              {TIPOS.map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => handleTypeChange(tipo)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedType === tipo
                      ? "bg-[#00A651] text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Ordenação por Data */}
          <div>
            <label className="block text-sm font-medium text-[#004417] mb-2">
              <ArrowUpDown className="w-4 h-4 inline-block mr-1" />
              Ordenar por
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleOrdenacaoChange("alfabetica")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  ordenacao === "alfabetica"
                    ? "bg-[#00A651] text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                A-Z
              </button>
              <button
                onClick={() => handleOrdenacaoChange("recentes")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  ordenacao === "recentes"
                    ? "bg-[#00A651] text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Mais recentes
              </button>
              <button
                onClick={() => handleOrdenacaoChange("antigos")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  ordenacao === "antigos"
                    ? "bg-[#00A651] text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Mais antigos
              </button>
            </div>
          </div>

          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#F7941F] hover:bg-[#F7941F]/10 rounded-lg transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
