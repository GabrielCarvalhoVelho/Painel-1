import React, { useEffect, useState } from 'react';
import { TrendingUp, Minus } from 'lucide-react';
import { FinanceService} from '../../services/financeService';
import { CustoConabService } from '../../services/custoService';

interface CustoItem {
  categoria: string;
  realHectare: number;
  realSaca: number;
  estimadoHectare: number;
  estimadoSaca: number;
  valor: number;   
}
interface Estatistica {
  categoria: string;
  valor?: number;
  total?: number;
}

const CustosTable: React.FC<{ userId: string; areaCultivada: number; produtividade: number }> = ({
  userId,
  areaCultivada,
  produtividade,
}) => {
  const [custos, setCustos] = useState<CustoItem[]>([]);
  const [custoService] = useState(() => new CustoConabService());

  // Category mapping from financial categories to CustoService discriminacao

  useEffect(() => {
    const fetchData = async () => {
      const estatisticas = await FinanceService.getTransactionsByCategory(userId);
      console.log("Dados recebidos do serviço:", estatisticas);
      const processados = updateCustosWithFinancialData(estatisticas, areaCultivada, produtividade);
      setCustos(processados); // Aqui sim atualiza o estado
    };

    fetchData();
  }, [userId, areaCultivada, produtividade]);

  const toNumber = (x: unknown): number => {
    if (typeof x === "number") return x;
    if (typeof x === "string") {
      // remove separador de milhar e troca vírgula por ponto
      const s = x.replace(/\./g, "").replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };




 const updateCustosWithFinancialData = (
  estatisticas: Estatistica[],
  areaCultivadaIn: number | string,
  produtividadeIn: number | string
) => {
  const areaCultivada = toNumber(areaCultivadaIn);
  const produtividade = toNumber(produtividadeIn);

  // 1. Agrupa valores reais do usuário, excluindo categoria "Receita"
  const grouped = estatisticas.reduce((acc, est) => {
    const categoria = est.categoria || "Sem categoria";
    // Ignora categoria "Receita"
    if (categoria === "Receita") {
      return acc;
    }
    const valorCategoria = Math.abs(est.valor ?? est.total ?? 0);
    acc[categoria] = (acc[categoria] || 0) + valorCategoria;
    return acc;
  }, {} as Record<string, number>);

  // 2. Pega todas as categorias da CONAB como base (já sem "Receita")
  const todasCategorias = CustoConabService.getAllCustos();

  // 3. Monta array final, mesmo que valor real = 0
  return todasCategorias.map((item) => {
    const valor = grouped[item.discriminacao] ?? 0;
    const realHectare = areaCultivada > 0 ? valor / areaCultivada : 0;
    const realSaca = produtividade > 0 ? realHectare / produtividade : 0;

    return {
      categoria: item.discriminacao,
      valor,
      realHectare: realHectare,
      realSaca: realSaca,
      estimadoHectare: item.custoPorHa,
      estimadoSaca: item.custoPorSaca,
    };
  });
};


  useEffect(() => {
    console.log("Custos no estado >>>", custos);
  }, [custos]);

  const formatNumber = (num: number, decimals: number = 4): string => {
    return num.toFixed(decimals).replace('.', ',');
  };

  // Sort custos alphabetically by categoria
  const custosSorted = [...custos].sort((a, b) =>
    a.categoria.localeCompare(b.categoria, 'pt-BR')
  );

  // Totals
  const totalRealHectare = custos.reduce((acc, item) => acc + item.realHectare, 0);
  const totalRealSaca = custos.reduce((acc, item) => acc + item.realSaca, 0);
  const totalEstimadoHectare = custos.reduce((acc, item) => acc + item.estimadoHectare, 0);
  const totalEstimadoSaca = custos.reduce((acc, item) => acc + item.estimadoSaca, 0);
  
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,68,23,0.06)] p-5 transition-transform duration-200 hover:scale-[1.01]">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-[#00A651]" />
            <span className="text-sm font-semibold text-[#004417]">Custo Real/ha</span>
          </div>
          <p className="text-[22px] font-bold text-[#004417]">R$ {formatNumber(totalRealHectare)}</p>
          <p className="text-[13px] text-[rgba(0,68,23,0.75)] font-medium">Calculado com dados reais</p>
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,68,23,0.06)] p-5 transition-transform duration-200 hover:scale-[1.01]">
          <div className="flex items-center space-x-2 mb-3">
            <Minus className="w-5 h-5 text-[#00A651]" />
            <span className="text-sm font-semibold text-[#004417]">Custo Real/Saca</span>
          </div>
          <p className="text-[22px] font-bold text-[#004417]">R$ {formatNumber(totalRealSaca)}</p>
          <p className="text-[13px] text-[rgba(0,68,23,0.75)] font-medium">Calculado com dados reais</p>
        </div>
      </div>

      {/* Custo por Hectare Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#004417]">Custos por Hectare</h3>
        <div className="overflow-x-auto bg-white rounded-xl shadow-[0_2px_8px_rgba(0,68,23,0.06)] overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-[#004417]">
              <tr>
                <th className="px-5 py-3 text-left text-[13px] font-semibold text-white">Categoria</th>
                <th className="px-5 py-3 text-center text-[13px] font-semibold text-white">Estimado (R$/ha)</th>
                <th className="px-5 py-3 text-center text-[13px] font-semibold text-white">Real (R$/ha)</th>
              </tr>
            </thead>
            <tbody>
              {custosSorted.map((item, index) => (
                <tr key={`ha-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[rgba(0,68,23,0.02)]'}>
                  <td className="px-5 py-2 text-xs sm:text-sm text-[#004417] font-medium break-words max-w-[120px] border-b border-[rgba(0,68,23,0.06)]">
                    {item.categoria}
                  </td>
                  <td className="px-5 py-2 text-center border-b border-[rgba(0,68,23,0.06)]">
                    <span className="text-sm font-medium text-[#004417]">
                      R$ {formatNumber(item.estimadoHectare)}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-center border-b border-[rgba(0,68,23,0.06)]">
                    <span className="text-sm font-semibold text-[#00A651]">
                      R$ {formatNumber(item.realHectare)}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="total-geral bg-[rgba(0,166,81,0.06)]">
                <td className="px-5 py-4 text-sm text-[#004417] font-bold">TOTAL GERAL</td>
                <td className="px-5 py-4 text-center text-sm text-[#004417] font-bold">
                  R$ {formatNumber(totalEstimadoHectare)}
                </td>
                <td className="px-5 py-4 text-center text-sm text-[#004417] font-bold">
                  R$ {formatNumber(totalRealHectare)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Custo por Saca Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#004417]">Custos por Saca</h3>
        <div className="overflow-x-auto bg-white rounded-xl shadow-[0_2px_8px_rgba(0,68,23,0.06)] overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-[#004417]">
              <tr>
                <th className="px-5 py-3 text-left text-[13px] font-semibold text-white">Categoria</th>
                <th className="px-5 py-3 text-center text-[13px] font-semibold text-white">Estimado (R$/sc)</th>
                <th className="px-5 py-3 text-center text-[13px] font-semibold text-white">Real (R$/sc)</th>
              </tr>
            </thead>
            <tbody>
              {custosSorted.map((item, index) => (
                <tr key={`saca-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[rgba(0,68,23,0.02)]'}>
                  <td className="px-5 py-2 text-xs sm:text-sm text-[#004417] font-medium break-words max-w-[120px] border-b border-[rgba(0,68,23,0.06)]">
                    {item.categoria}
                  </td>
                  <td className="px-5 py-2 text-center border-b border-[rgba(0,68,23,0.06)]">
                    <span className="text-sm font-medium text-[#004417]">
                      R$ {formatNumber(item.estimadoSaca)}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-center border-b border-[rgba(0,68,23,0.06)]">
                    <span className="text-sm font-semibold text-[#00A651]">
                      R$ {formatNumber(item.realSaca)}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="total-geral bg-[rgba(0,166,81,0.06)]">
                <td className="px-5 py-4 text-sm text-[#004417] font-bold">TOTAL GERAL</td>
                <td className="px-5 py-4 text-center text-sm text-[#004417] font-bold">
                  R$ {formatNumber(totalEstimadoSaca)}
                </td>
                <td className="px-5 py-4 text-center text-sm text-[#004417] font-bold">
                  R$ {formatNumber(totalRealSaca)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustosTable;