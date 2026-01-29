'use client';

import { Document } from '@/types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface DocumentCardProps {
  document: Document;
  onPreview?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function DocumentCard({ document, onPreview, onDownload, onDelete }: DocumentCardProps) {
  const categoryLabels: Record<string, string> = {
    manuale_uso: "Manuale d'uso",
    certificazione_ce: 'Certificazione CE',
    scheda_tecnica: 'Scheda Tecnica',
    fattura_acquisto: 'Fattura Acquisto',
    altro: 'Altro',
  };

  const categoryBadgeClass: Record<string, string> = {
    manuale_uso: 'badge badge-blue',
    certificazione_ce: 'badge badge-green',
    scheda_tecnica: 'badge badge-purple',
    fattura_acquisto: 'badge badge-yellow',
    altro: 'badge badge-gray',
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) {
      return (
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType?.includes('image')) {
      return (
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  return (
    <div className="card p-4 h-full flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
      <div className="flex-1">
        <div className="flex justify-center mb-3">
          {getFileIcon(document.mimeType || '')}
        </div>

        <h3
          className="font-semibold text-gray-900 mb-2 truncate"
          title={document.fileName}
        >
          {document.fileName}
        </h3>

        <div className="mb-3">
          <span className={categoryBadgeClass[document.documentCategory] || 'badge badge-gray'}>
            {categoryLabels[document.documentCategory] || document.documentCategory}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-400 text-xs">Macchinario</span>
            <p className="font-medium text-gray-700">
              {document.machine
                ? `${document.machine.model || document.machine.manufacturer || ''} (${document.machine.serialNumber})`.trim()
                : '-'}
            </p>
          </div>

          <div className="flex justify-between">
            <div>
              <span className="text-gray-400 text-xs">Dimensione</span>
              <p className="text-gray-600">{formatFileSize(document.fileSize || 0)}</p>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-xs">Caricato il</span>
              <p className="text-gray-600">
                {format(new Date(document.uploadedAt || new Date()), 'dd/MM/yyyy', { locale: it })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-gray-100">
        {onPreview && (
          <button
            onClick={() => onPreview(document.id)}
            className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            title="Anteprima"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}

        {onDownload && (
          <button
            onClick={() => onDownload(document.id)}
            className="p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            title="Scarica"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(document.id)}
            className="p-2 rounded-lg bg-gray-900 text-white hover:bg-red-600 transition-colors"
            title="Elimina"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
