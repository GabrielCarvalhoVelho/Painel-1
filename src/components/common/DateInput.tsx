import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

// Registrar locale português do Brasil
registerLocale('pt-BR', ptBR);

interface DateInputProps {
  value: string; // Valor no formato yyyy-mm-dd
  onChange: (value: string) => void; // Retorna valor no formato yyyy-mm-dd
  placeholder?: string;
  className?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export default function DateInput({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  className = '',
  required = false,
  minDate,
  maxDate,
}: DateInputProps) {
  // Converter valor string (yyyy-mm-dd) para Date object
  const dateValue = value ? new Date(value + 'T00:00:00') : null;

  const handleChange = (date: Date | null) => {
    if (date) {
      // Converter Date object para string no formato yyyy-mm-dd
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <DatePicker
        selected={dateValue}
        onChange={handleChange}
        locale="pt-BR"
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        className="w-full px-4 py-3 pr-11 rounded-[12px] bg-white shadow-[0_1px_3px_rgba(0,68,23,0.06)] text-[#004417] placeholder:text-gray-400 border border-transparent focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20 focus:outline-none transition-all"
        wrapperClassName="w-full"
        calendarClassName="shadow-xl border-[#00A651]"
        required={required}
      />
      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#004417]/65 pointer-events-none" />
      <style>{`
        .react-datepicker {
          font-family: inherit;
          font-size: 13px !important;
          border: 1px solid rgba(0, 166, 81, 0.2) !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 20px rgba(0, 68, 23, 0.12) !important;
          padding: 0 !important;
          width: fit-content !important;
        }
        .react-datepicker__header {
          background-color: #00A651 !important;
          border-bottom: 1px solid rgba(0, 166, 81, 0.1) !important;
          border-radius: 10px 10px 0 0 !important;
          padding: 8px 12px !important;
          margin: 0 !important;
        }
        .react-datepicker__current-month {
          color: white !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          margin: 0 !important;
          padding: 0 !important;
          text-align: center !important;
        }
        .react-datepicker__day-name {
          color: rgba(0, 68, 23, 0.7) !important;
          font-weight: 500 !important;
          font-size: 12px !important;
          width: 28px !important;
          height: 24px !important;
          line-height: 24px !important;
          margin: 0 !important;
        }
        .react-datepicker__day {
          width: 28px !important;
          height: 28px !important;
          line-height: 28px !important;
          color: #004417 !important;
          border-radius: 6px !important;
          transition: all 0.15s !important;
          margin: 2px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
        }
        .react-datepicker__day:hover:not(.react-datepicker__day--outside-month) {
          background-color: #00A651 !important;
          color: white !important;
          border-radius: 6px !important;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #00A651 !important;
          color: white !important;
          font-weight: 600 !important;
          border-radius: 6px !important;
        }
        .react-datepicker__day--today {
          font-weight: 700 !important;
          color: #00A651 !important;
          border: 2px solid #00A651 !important;
          background-color: rgba(0, 166, 81, 0.05) !important;
        }
        .react-datepicker__day--outside-month {
          color: rgba(0, 68, 23, 0.2) !important;
        }
        .react-datepicker__month-select,
        .react-datepicker__year-select {
          background-color: white !important;
          color: #004417 !important;
          border: 1px solid rgba(0, 166, 81, 0.15) !important;
          border-radius: 5px !important;
          padding: 3px 6px !important;
          font-weight: 500 !important;
          font-size: 12px !important;
          cursor: pointer !important;
          margin: 0 2px !important;
        }
        .react-datepicker__month-select:hover,
        .react-datepicker__year-select:hover {
          background-color: rgba(0, 166, 81, 0.05) !important;
        }
        .react-datepicker__month-year-read-view {
          padding: 0 !important;
        }
        .react-datepicker__month-year-read-view--down-arrow {
          display: none !important;
        }
        .react-datepicker__navigation {
          top: 8px !important;
          line-height: 24px !important;
          padding: 0 4px !important;
        }
        .react-datepicker__navigation--previous {
          left: 8px !important;
        }
        .react-datepicker__navigation--next {
          right: 8px !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: white !important;
          border-width: 1px !important;
          height: 6px !important;
          width: 6px !important;
        }
        .react-datepicker__navigation:hover *::before {
          border-color: rgba(255, 255, 255, 0.9) !important;
        }
        .react-datepicker__triangle {
          display: none !important;
        }
        .react-datepicker__week {
          padding: 2px 4px !important;
        }
        .react-datepicker__month {
          margin: 0 !important;
          padding: 4px 8px !important;
        }
        /* Mobile touch improvements */
        @media (max-width: 768px) {
          .react-datepicker {
            font-size: 14px !important;
          }
          .react-datepicker__day {
            width: 32px !important;
            height: 32px !important;
            line-height: 32px !important;
            margin: 3px !important;
          }
          .react-datepicker__day-name {
            width: 32px !important;
            height: 28px !important;
            line-height: 28px !important;
          }
        }
      `}</style>
    </div>
  );
}
