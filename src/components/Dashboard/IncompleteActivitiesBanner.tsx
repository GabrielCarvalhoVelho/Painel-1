interface Props {
  count: number;
  onReview: () => void;
}

export default function IncompleteActivitiesBanner({ count, onReview }: Props) {
  return (
    <>
      {/* MOBILE: manter exatamente a versão mobile otimizada (cores iguais ao NfBanner) */}
      <div
        role="region"
        aria-label="Atividades incompletas"
        className="sm:hidden bg-orange-50 border-l-4 border-orange-300 p-3 rounded-md"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-orange-700">Atividades agrícolas incompletas</div>

          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">Pendentes: {count}</span>
            </div>

            <p className="text-xs text-orange-700/90 mt-2 sm:mt-0 sm:ml-2">Revise as atividades agrícolas incompletas.</p>
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={onReview}
            className="w-full px-4 py-2 bg-orange-100 text-orange-800 rounded-md font-semibold hover:bg-orange-200"
          >
            Revisar atividades
          </button>
        </div>
      </div>

      {/* DESKTOP: mesma aparência do NfBanner (linha única) */}
      <div
        role="region"
        aria-label="Atividades incompletas"
        className="hidden sm:flex bg-orange-50 border-l-4 border-orange-300 p-4 rounded-md items-start sm:items-center justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-orange-700">Atividades agrícolas incompletas</div>
          <div className="text-xs text-orange-700/90 mt-1 leading-snug text-justify sm:text-left break-words">
            Você tem {count} atividades agrícolas incompletas que precisam ser revisadas. Revise e confirme ou exclua conforme necessário.
          </div>
        </div>

        <div className="flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={onReview}
            className="w-full sm:w-auto px-4 py-2 bg-orange-100 text-orange-800 rounded-md font-semibold hover:bg-orange-200"
          >
            Revisar atividades
          </button>
        </div>
      </div>
    </>
  );
}
