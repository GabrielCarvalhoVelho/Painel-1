import React from 'react';

interface Props {
  numero?: string;
  fornecedor?: string;
  recebidoEm?: string;
  onReview: () => void;
}

export default function NfBanner({ numero, fornecedor, recebidoEm, onReview }: Props) {
  return (
    <>
      {/* MOBILE: manter exatamente a versão mobile otimizada (não alterar) */}
      <div
        role="region"
        aria-label="Novo lançamento de produtos via NF"
        className="sm:hidden bg-orange-50 border-l-4 border-orange-300 p-3 rounded-md"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-orange-700">Novo lançamento de produtos via NF</div>

          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-wrap gap-2">
              {numero ? (
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">NF {numero}</span>
              ) : null}

              {fornecedor ? (
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">{fornecedor}</span>
              ) : null}

              {recebidoEm ? (
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">Recebida: {recebidoEm}</span>
              ) : null}
            </div>

            <p className="text-xs text-orange-700/90 mt-2 sm:mt-0 sm:ml-2">Revise os itens antes de lançar no estoque.</p>
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={onReview}
            className="w-full px-4 py-2 bg-orange-100 text-orange-800 rounded-md font-semibold hover:bg-orange-200"
          >
            Revisar lançamento
          </button>
        </div>
      </div>

      {/* DESKTOP: versão original (linha única de informação) */}
      <div
        role="region"
        aria-label="Novo lançamento de produtos via NF"
        className="hidden sm:flex bg-orange-50 border-l-4 border-orange-300 p-4 rounded-md items-start sm:items-center justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-orange-700">Novo lançamento de produtos via NF</div>
          <div className="text-xs text-orange-700/90 mt-1 leading-snug text-justify sm:text-left break-words">
            NF {numero ?? ''} {fornecedor ? `• ${fornecedor}` : ''} {recebidoEm ? `• recebida em ${recebidoEm}` : ''}. Revise os itens antes de lançar no estoque.
          </div>
        </div>

        <div className="flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={onReview}
            className="w-full sm:w-auto px-4 py-2 bg-orange-100 text-orange-800 rounded-md font-semibold hover:bg-orange-200"
          >
            Revisar lançamento
          </button>
        </div>
      </div>
    </>
  );
}
