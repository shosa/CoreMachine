'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PublicDocument {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentCategory: string;
  uploadedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  manuale_uso: "Manuale d'uso",
  certificazione_ce: 'Certificazione CE',
  scheda_tecnica: 'Scheda Tecnica',
  fattura_acquisto: 'Fattura Acquisto',
  altro: 'Altro',
};

export default function MobileDocumentsPage() {
  const params = useParams();
  const [docs, setDocs] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/documents/machine/${params.id}`)
      .then((r) => r.json())
      .then((data: PublicDocument[]) =>
        setDocs(data.filter((d) => d.documentCategory !== 'fattura_acquisto'))
      )
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [params.id]);

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  };

  return (
    <div className="p-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 mb-4">
        <Link href={`/m/${params.id}`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Documenti</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-sm">Nessun documento disponibile</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {CATEGORY_LABELS[doc.documentCategory] ?? doc.documentCategory}
                    </span>
                    <span className="text-xs text-gray-400">{formatSize(doc.fileSize)}</span>
                  </div>
                </div>
              </div>
              <a
                href={`/api/public/documents/${doc.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Scarica
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
