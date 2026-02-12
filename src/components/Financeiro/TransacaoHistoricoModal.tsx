import { useEffect, useState } from 'react';
import { X, Clock, ArrowRight } from 'lucide-react';
import {
  HistoricoTransacoesService,
  HistoricoEdicaoFormatado,
} from '../../services/historicoTransacoesService';
import LoadingSpinner from '../Dashboard/LoadingSpinner';

interface TransacaoHistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  idTransacao: string;
}

export default function TransacaoHistoricoModal({
  isOpen,
  onClose,
  idTransacao,
}: TransacaoHistoricoModalProps) {
  const [historico, setHistorico] = useState<HistoricoEdicaoFormatado[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar histórico quando o modal abre
  useEffect(() => {
    if (isOpen && idTransacao) {
      loadHistorico();
    }
  }, [isOpen, idTransacao]);

  const loadHistorico = async () => {
    setLoading(true);
    try {
      const dados = await HistoricoTransacoesService.getHistoricoFormatado(idTransacao);
      setHistorico(dados);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDataHora = (data: Date): string => {
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-[#004417]">
              Histórico de Edições
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6" data-modal-content>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : historico.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Esta transação não possui histórico de edições
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  As edições futuras serão registradas aqui
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Timeline vertical */}
                {historico.map((edicao, index) => (
                  <div key={edicao.id} className="relative">
                    {/* Linha conectora (exceto último item) */}
                    {index < historico.length - 1 && (
                      <div className="absolute left-[15px] top-[40px] w-[2px] h-[calc(100%+24px)] bg-gray-200" />
                    )}

                    <div className="flex gap-4">
                      {/* Ícone de timeline */}
                      <div className="flex-shrink-0 w-8 h-8 bg-[#00A651] rounded-full flex items-center justify-center relative z-10">
                        <Clock className="w-4 h-4 text-white" />
                      </div>

                      {/* Card de edição */}
                      <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {/* Cabeçalho da edição */}
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-[#004417]">
                            Editado em {formatDataHora(edicao.editadoEm)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            por {edicao.nomeEditor}
                          </p>
                        </div>

                        {/* Lista de alterações */}
                        <div className="space-y-2">
                          {edicao.alteracoes.map((alteracao, altIndex) => (
                            <div
                              key={altIndex}
                              className="bg-white rounded-md p-3 border border-gray-100"
                            >
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                {alteracao.campo}
                              </p>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600 line-through">
                                  {String(alteracao.valorAnterior)}
                                </span>
                                <ArrowRight className="w-4 h-4 text-[#00A651] flex-shrink-0" />
                                <span className="text-[#004417] font-semibold">
                                  {String(alteracao.valorNovo)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white bg-[#00A651] rounded-lg hover:bg-[#00A651]/90 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
