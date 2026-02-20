'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/Toast';
import { Machine, Maintenance, Document, AuditLog } from '@/types';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <div className="py-6">{children}</div>}
    </div>
  );
}

/* ---------- SVG icon helpers ---------- */
const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconQr = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm14 3h.01M17 14h.01M14 17h.01M14 14h3v3h-3v-3zm3 3h3v3h-3v-3z" />
  </svg>
);
const IconWrench = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconPrint = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);
const IconClose = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconUpload = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);
const IconDownload = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconEye = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const IconDoc = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const toast = useToast();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentCategory, setDocumentCategory] = useState('');
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [docPreviewOpen, setDocPreviewOpen] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState('');
  const [docPreviewName, setDocPreviewName] = useState('');
  const [deleteDocModal, setDeleteDocModal] = useState<{ open: boolean; docId: string; docName: string }>({ open: false, docId: '', docName: '' });
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  /* ---------- audit log (lazy) ---------- */
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [auditExpandedRows, setAuditExpandedRows] = useState<Set<string>>(new Set());

  /* ---------- sorting helpers for tables ---------- */
  const [maintSort, setMaintSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'date', dir: 'desc' });
  const [docSort, setDocSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'uploadedAt', dir: 'desc' });

  useEffect(() => {
    fetchMachine();
  }, [params.id]);

  const fetchMachine = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/machines/${params.id}`);
      setMachine(response.data);
    } catch (error: any) {
      toast.showError('Errore nel caricamento del macchinario');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      const url = `${window.location.origin}/m/${params.id}`;
      const qrUrl = await QRCode.toDataURL(url, { width: 400 });
      setQrCodeUrl(qrUrl);
      setQrDialogOpen(true);
    } catch (error) {
      toast.showError('Errore nella generazione del QR code');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !documentCategory) {
      toast.showWarning('Seleziona un file e una categoria');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('machineId', params.id as string);
      formData.append('documentCategory', documentCategory);

      await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.showSuccess('Documento caricato con successo');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentCategory('');
      fetchMachine();
    } catch (error: any) {
      toast.showError(error.response?.data?.message || 'Errore durante il caricamento');
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewDocument = async (doc: Document) => {
    try {
      const response = await axiosInstance.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      setDocPreviewUrl(blobUrl);
      setDocPreviewName(doc.fileName);
      setDocPreviewOpen(true);
    } catch (error) {
      toast.showError('Errore durante la visualizzazione');
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await axiosInstance.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.showError('Errore durante il download');
    }
  };

  const handleDeleteDocumentConfirm = async () => {
    if (!deleteDocModal.docId) return;
    setIsDeletingDoc(true);
    try {
      await axiosInstance.delete(`/documents/${deleteDocModal.docId}`);
      toast.showSuccess('Documento eliminato');
      setDeleteDocModal({ open: false, docId: '', docName: '' });
      fetchMachine();
    } catch (error) {
      toast.showError("Errore durante l'eliminazione");
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const handlePrintMachineSheet = async () => {
    if (!machine) return;

    try {
      // Generate QR Code
      const qrUrl = `${window.location.origin}/m/${params.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Header - Title and Logo Area
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, 40, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SCHEDA MACCHINARIO', pageWidth / 2, 15, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('CoreMachine', pageWidth / 2, 25, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text(format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it }), pageWidth / 2, 33, {
        align: 'center',
      });

      yPos = 50;

      // Machine Description - Big Title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.description || 'Macchinario senza descrizione', margin, yPos);
      yPos += 10;

      // Divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Section 1: Identificazione
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('IDENTIFICAZIONE', margin + 2, yPos);
      yPos += 10;

      const col1X = margin + 5;
      const col2X = pageWidth / 2 + 5;
      const lineHeight = 7;

      // Row 1
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('MATRICOLA:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.serialNumber, col1X + 25, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('CATEGORIA:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.type?.category?.name || '-', col2X + 25, yPos);
      yPos += lineHeight;

      // Row 2
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('PRODUTTORE:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.manufacturer || '-', col1X + 25, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('TIPO:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.type?.name || '-', col2X + 25, yPos);
      yPos += lineHeight;

      // Row 3
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('MODELLO:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.model || '-', col1X + 25, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('ANNO:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.yearBuilt?.toString() || '-', col2X + 25, yPos);
      yPos += lineHeight + 5;

      // Section 2: Informazioni Acquisto
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('INFORMAZIONI ACQUISTO', margin + 2, yPos);
      yPos += 10;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('DATA ACQUISTO:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        machine.purchaseDate
          ? format(new Date(machine.purchaseDate), 'dd/MM/yyyy', { locale: it })
          : '-',
        col1X + 30,
        yPos,
      );

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('RIVENDITORE:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.dealer || '-', col2X + 30, yPos);
      yPos += lineHeight;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('RIF. FATTURA:', col1X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.invoiceReference || '-', col1X + 30, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('POSIZIONE DOC.:', col2X, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(machine.documentLocation || '-', col2X + 30, yPos);
      yPos += lineHeight + 5;

      // Section 3: QR Code per Manutenzione
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('ACCESSO RAPIDO MANUTENZIONE', margin + 2, yPos);
      yPos += 10;

      // QR Code centered
      const qrSize = 60;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, yPos, qrSize, qrSize);
      yPos += qrSize + 5;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Scansiona per registrare manutenzione', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Section 4: Statistiche Manutenzione
      if (machine.maintenances && machine.maintenances.length > 0) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(26, 115, 232);
        pdf.text('STATISTICHE MANUTENZIONE', margin + 2, yPos);
        yPos += 10;

        const totalMaintenances = machine.maintenances.length;
        const lastMaintenance = machine.maintenances[0];

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text('TOT. MANUTENZIONI:', col1X, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(totalMaintenances.toString(), col1X + 40, yPos);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text('ULTIMA MANUTENZIONE:', col2X, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(
          lastMaintenance
            ? format(new Date(lastMaintenance.date), 'dd/MM/yyyy', { locale: it })
            : '-',
          col2X + 45,
          yPos,
        );
        yPos += lineHeight + 5;
      }

      // Footer
      const footerY = pageHeight - 15;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text('CoreMachine', margin, footerY);
      pdf.text(
        `Stampato il ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it })}`,
        pageWidth - margin,
        footerY,
        { align: 'right' },
      );

      // Create Blob URL for preview
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(blobUrl);
      setPdfPreviewOpen(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.showError('Errore durante la generazione del PDF');
    }
  };

  /* ---------- sorted data ---------- */
  const sortedMaintenances = useMemo(() => {
    if (!machine?.maintenances) return [];
    return [...machine.maintenances].sort((a: any, b: any) => {
      const aVal = a[maintSort.field];
      const bVal = b[maintSort.field];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return maintSort.dir === 'asc' ? cmp : -cmp;
    });
  }, [machine?.maintenances, maintSort]);

  const sortedDocuments = useMemo(() => {
    if (!machine?.documents) return [];
    return [...machine.documents].sort((a: any, b: any) => {
      const aVal = a[docSort.field];
      const bVal = b[docSort.field];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return docSort.dir === 'asc' ? cmp : -cmp;
    });
  }, [machine?.documents, docSort]);

  const toggleMaintSort = (field: string) => {
    setMaintSort(prev =>
      prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' },
    );
  };

  const toggleDocSort = (field: string) => {
    setDocSort(prev =>
      prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' },
    );
  };

  const handlePrintZplLabel = async () => {
    if (!machine) return;
    try {
      const res = await axiosInstance.post('/printer/machine-label', {
        machineId: machine.id,
        serialNumber: machine.serialNumber,
        description: machine.description,
        manufacturer: machine.manufacturer,
        model: machine.model,
        appUrl: window.location.origin,
      });
      if (res.data.success) {
        toast.showSuccess('Etichetta inviata alla stampante');
      } else {
        toast.showError(res.data.message || 'Errore nella stampa');
      }
    } catch {
      toast.showError('Stampante non raggiungibile');
    }
  };

  const handleTabChange = async (idx: number) => {
    setTabValue(idx);
    if (idx === 3 && !auditLoaded) {
      setAuditLoading(true);
      try {
        const res = await axiosInstance.get('/audit', {
          params: { entity: 'Machine', entityId: params.id, limit: 100 },
        });
        setAuditLogs(res.data.data ?? []);
        setAuditLoaded(true);
      } catch {
        // silent
      } finally {
        setAuditLoading(false);
      }
    }
  };

  const toggleAuditRow = (id: string) => {
    setAuditExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const SortIndicator = ({ field, sort }: { field: string; sort: { field: string; dir: string } }) => {
    if (sort.field !== field) return null;
    return <span className="ml-1 text-xs">{sort.dir === 'asc' ? '\u25B2' : '\u25BC'}</span>;
  };

  /* ---------- badge helpers ---------- */
  const maintenanceTypeBadge = (type: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      ordinaria: { label: 'Ordinaria', cls: 'badge badge-success' },
      straordinaria: { label: 'Straordinaria', cls: 'badge badge-info' },
      guasto: { label: 'Guasto', cls: 'badge badge-error' },
      riparazione: { label: 'Riparazione', cls: 'badge badge-warning' },
    };
    const entry = map[type] || { label: type, cls: 'badge' };
    return <span className={entry.cls}>{entry.label}</span>;
  };

  const docCategoryLabel = (cat: string) => {
    const categories: Record<string, string> = {
      manuale_uso: "Manuale d'uso",
      certificazione_ce: 'Certificazione CE',
      scheda_tecnica: 'Scheda Tecnica',
      fattura_acquisto: 'Fattura Acquisto',
      altro: 'Altro',
    };
    return <span className="badge">{categories[cat] || cat}</span>;
  };

  const tabs = [
    { label: 'Dettagli Tecnici' },
    { label: `Storico Manutenzioni (${machine?.maintenances?.length || 0})`, icon: <IconWrench /> },
    { label: `Documenti (${machine?.documents?.length || 0})`, icon: <IconDoc /> },
    { label: 'Storico Modifiche', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
  ];

  /* ---------- loading / not found ---------- */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div>
        <p className="text-gray-600">Macchinario non trovato</p>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumbs + title */}
      <div className="mb-6">
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/machines" className="hover:text-gray-900 transition-colors">Macchinari</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{machine.serialNumber}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">
          {machine.description || `Macchinario ${machine.serialNumber}`}
        </h1>
      </div>

      {/* Header Card */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: info */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{machine.description}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="badge">{machine.manufacturer} {machine.model}</span>
                <span className="badge badge-info">{machine.type?.category?.name || 'N/A'}</span>
                <span className="badge">{machine.type?.name || 'N/A'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-gray-500 block">Matricola</span>
                <span className="text-sm font-semibold text-gray-900">{machine.serialNumber}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Anno</span>
                <span className="text-sm font-semibold text-gray-900">{machine.yearBuilt || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Data Acquisto</span>
                <span className="text-sm font-semibold text-gray-900">
                  {machine.purchaseDate
                    ? format(new Date(machine.purchaseDate), 'dd/MM/yyyy', { locale: it })
                    : '-'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Rivenditore</span>
                <span className="text-sm font-semibold text-gray-900">{machine.dealer || '-'}</span>
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex flex-col gap-3">
            <button
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              onClick={() => router.push(`/maintenances/new?machineId=${params.id}`)}
            >
              <IconWrench /> Nuova Manutenzione
            </button>
            <button
              className="btn w-full flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 transition-colors rounded-lg px-4 py-2 text-sm font-medium"
              onClick={handlePrintMachineSheet}
            >
              <IconPrint /> Stampa Scheda
            </button>
            <button
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
              onClick={handleGenerateQR}
            >
              <IconQr /> Genera QR Code
            </button>
            <button
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
              onClick={handlePrintZplLabel}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Stampa Etichetta ZPL
            </button>
            {hasRole(['admin', 'tecnico']) && (
              <button
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
                onClick={() => router.push(`/machines/${params.id}/edit`)}
              >
                <IconEdit /> Modifica Scheda
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Card */}
      <div className="card">
        {/* Tab bar */}
        <div className="border-b border-gray-200 px-4">
          <div className="flex gap-0">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tabValue === idx
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Dettagli Tecnici */}
        <TabPanel value={tabValue} index={0}>
          <div className="px-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Informazioni Generali</h3>
            <hr className="mb-4 border-gray-200" />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Categoria', value: machine.type?.category?.name || '-' },
                { label: 'Tipo Macchinario', value: machine.type?.name || '-' },
                { label: 'Numero Seriale', value: machine.serialNumber },
                { label: 'Produttore', value: machine.manufacturer || '-' },
                { label: 'Modello', value: machine.model || '-' },
                { label: 'Anno di Costruzione', value: machine.yearBuilt || '-' },
                {
                  label: 'Data di Acquisto',
                  value: machine.purchaseDate
                    ? format(new Date(machine.purchaseDate), 'dd MMMM yyyy', { locale: it })
                    : '-',
                },
                { label: 'Rivenditore', value: machine.dealer || '-' },
                { label: 'Riferimento Fattura', value: machine.invoiceReference || '-' },
                { label: 'Locazione Documenti', value: machine.documentLocation || '-' },
              ].map((item, i) => (
                <div key={i}>
                  <span className="text-xs text-gray-500 block">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-1">Descrizione</h3>
            <hr className="mb-4 border-gray-200" />
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">{machine.description || 'Nessuna descrizione'}</p>
            </div>
          </div>
        </TabPanel>

        {/* Tab: Storico Manutenzioni */}
        <TabPanel value={tabValue} index={1}>
          <div className="px-4">
            {machine.maintenances && machine.maintenances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none" onClick={() => toggleMaintSort('date')}>
                        Data <SortIndicator field="date" sort={maintSort} />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none" onClick={() => toggleMaintSort('type')}>
                        Tipo <SortIndicator field="type" sort={maintSort} />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Lavoro Eseguito</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none" onClick={() => toggleMaintSort('cost')}>
                        Costo <SortIndicator field="cost" sort={maintSort} />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMaintenances.map((m: any) => (
                      <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">{format(new Date(m.date), 'dd/MM/yyyy', { locale: it })}</td>
                        <td className="px-4 py-3">{maintenanceTypeBadge(m.type)}</td>
                        <td className="px-4 py-3 text-gray-700">{m.workPerformed}</td>
                        <td className="px-4 py-3">{m.cost ? `\u20AC${Number(m.cost).toFixed(2)}` : '-'}</td>
                        <td className="px-4 py-3">
                          <button
                            className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                            onClick={() => router.push(`/maintenances/${m.id}`)}
                            title="Visualizza"
                          >
                            <IconEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-500 mb-2">Nessuna manutenzione registrata</h3>
                <button
                  className="btn btn-primary mt-4 inline-flex items-center gap-2"
                  onClick={() => router.push(`/maintenances/new?machineId=${params.id}`)}
                >
                  <IconWrench /> Registra Prima Manutenzione
                </button>
              </div>
            )}
          </div>
        </TabPanel>

        {/* Tab: Storico Modifiche */}
        <TabPanel value={tabValue} index={3}>
          <div className="px-4">
            {auditLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                Nessuna modifica registrata per questo macchinario.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[170px]">Data</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[120px]">Azione</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Utente</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[80px]">Dettagli</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => {
                      const ACTION_COLORS: Record<string, string> = {
                        CREATE: 'bg-green-100 text-green-800',
                        UPDATE: 'bg-blue-100 text-blue-800',
                        DELETE: 'bg-red-100 text-red-800',
                      };
                      const ACTION_LABELS: Record<string, string> = {
                        CREATE: 'Creazione',
                        UPDATE: 'Modifica',
                        DELETE: 'Eliminazione',
                      };
                      const keys = [
                        ...Object.keys(log.changes?.before ?? {}),
                        ...Object.keys(log.changes?.after ?? {}),
                      ];
                      const hasChanges = keys.length > 0;
                      return (
                        <>
                          <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? ''}`}>
                                {ACTION_LABELS[log.action] ?? log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{log.userName}</td>
                            <td className="px-4 py-3">
                              {hasChanges ? (
                                <button
                                  onClick={() => toggleAuditRow(log.id)}
                                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                  <svg className={`w-4 h-4 transition-transform ${auditExpandedRows.has(log.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  Vedi
                                </button>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                          <AnimatePresence>
                            {auditExpandedRows.has(log.id) && (
                              <motion.tr
                                key={`${log.id}-exp`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                <td colSpan={4} className="px-4 pb-4 bg-gray-50">
                                  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden text-xs">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                          <th className="text-left px-3 py-2 font-semibold text-gray-600 w-1/3">Campo</th>
                                          <th className="text-left px-3 py-2 font-semibold text-red-600 w-1/3">Prima</th>
                                          <th className="text-left px-3 py-2 font-semibold text-green-600 w-1/3">Dopo</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {Array.from(new Set(keys)).map((key, i) => {
                                          const bval = log.changes?.before?.[key];
                                          const aval = log.changes?.after?.[key];
                                          const changed = JSON.stringify(bval) !== JSON.stringify(aval);
                                          return (
                                            <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                              <td className="px-3 py-2 font-mono text-gray-700">{key}</td>
                                              <td className={`px-3 py-2 font-mono ${changed && bval !== undefined ? 'bg-red-50 text-red-800' : 'text-gray-500'}`}>
                                                {bval !== undefined ? String(bval) : <span className="text-gray-300">—</span>}
                                              </td>
                                              <td className={`px-3 py-2 font-mono ${changed && aval !== undefined ? 'bg-green-50 text-green-800' : 'text-gray-500'}`}>
                                                {aval !== undefined ? String(aval) : <span className="text-gray-300">—</span>}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabPanel>

        {/* Tab: Documenti */}
        <TabPanel value={tabValue} index={2}>
          <div className="px-4">
            <div className="flex justify-end mb-4">
              <button
                className="btn btn-primary flex items-center gap-2"
                onClick={() => setUploadDialogOpen(true)}
              >
                <IconUpload /> Carica Documento
              </button>
            </div>

            {machine.documents && machine.documents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none" onClick={() => toggleDocSort('fileName')}>
                        Nome File <SortIndicator field="fileName" sort={docSort} />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Categoria</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none" onClick={() => toggleDocSort('fileSize')}>
                        Dimensione <SortIndicator field="fileSize" sort={docSort} />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none" onClick={() => toggleDocSort('uploadedAt')}>
                        Caricato il <SortIndicator field="uploadedAt" sort={docSort} />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDocuments.map((doc: any) => {
                      const kb = doc.fileSize / 1024;
                      const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
                      return (
                        <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{doc.fileName}</td>
                          <td className="px-4 py-3">{docCategoryLabel(doc.documentCategory)}</td>
                          <td className="px-4 py-3 text-gray-600">{sizeStr}</td>
                          <td className="px-4 py-3 text-gray-600">{format(new Date(doc.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: it })}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                                onClick={() => handlePreviewDocument(doc)}
                                title="Anteprima"
                              >
                                <IconEye />
                              </button>
                              <button
                                className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                                onClick={() => handleDownloadDocument(doc)}
                                title="Scarica"
                              >
                                <IconDownload />
                              </button>
                              <button
                                className="p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors"
                                onClick={() => setDeleteDocModal({ open: true, docId: doc.id as string, docName: doc.fileName })}
                                title="Elimina"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-500 mb-1">Nessun documento caricato</h3>
                <p className="text-sm text-gray-400 mb-4">Carica manuali, certificazioni, schede tecniche e altri documenti</p>
                <button
                  className="btn btn-primary inline-flex items-center gap-2"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <IconUpload /> Carica Primo Documento
                </button>
              </div>
            )}
          </div>
        </TabPanel>
      </div>

      {/* QR Code Dialog */}
      <AnimatePresence>
        {qrDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40"
              onClick={() => setQrDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">QR Code Macchinario</h2>
                <button onClick={() => setQrDialogOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <IconClose />
                </button>
              </div>
              <div className="p-6 text-center">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="max-w-full mx-auto" />}
                <p className="text-sm text-gray-500 mt-4">
                  Scansiona questo QR code per accedere rapidamente alla registrazione manutenzione
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {typeof window !== 'undefined' && `${window.location.origin}/m/${params.id}`}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Document Dialog */}
      <AnimatePresence>
        {uploadDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40"
              onClick={() => !uploading && setUploadDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Carica Documento</h2>
                <button
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={uploading}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <IconClose />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="label">Categoria Documento *</label>
                  <select
                    className="input"
                    value={documentCategory}
                    onChange={e => setDocumentCategory(e.target.value)}
                    required
                  >
                    <option value="">Seleziona categoria</option>
                    <option value="manuale_uso">Manuale d&apos;uso</option>
                    <option value="certificazione_ce">Certificazione CE</option>
                    <option value="scheda_tecnica">Scheda Tecnica</option>
                    <option value="fattura_acquisto">Fattura Acquisto</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>

                <div>
                  <input
                    accept="*/*"
                    className="hidden"
                    id="file-upload"
                    type="file"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="file-upload">
                    <span className="btn btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer py-3">
                      <IconUpload />
                      {selectedFile ? selectedFile.name : 'Seleziona File'}
                    </span>
                  </label>
                  {selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Dimensione: {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>

                <button
                  className="btn btn-primary w-full py-3"
                  onClick={handleFileUpload}
                  disabled={!selectedFile || !documentCategory || uploading}
                >
                  {uploading ? 'Caricamento...' : 'Carica Documento'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Preview Dialog */}
      <AnimatePresence>
        {pdfPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40"
              onClick={() => {
                setPdfPreviewOpen(false);
                URL.revokeObjectURL(pdfPreviewUrl);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4 h-[90vh] flex flex-col overflow-hidden z-10"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">Anteprima Scheda Macchinario</h2>
                <button
                  onClick={() => {
                    setPdfPreviewOpen(false);
                    URL.revokeObjectURL(pdfPreviewUrl);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <IconClose />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                {pdfPreviewUrl && (
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-full border-none"
                    title="Anteprima PDF"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Preview Dialog */}
      <AnimatePresence>
        {docPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40"
              onClick={() => {
                setDocPreviewOpen(false);
                URL.revokeObjectURL(docPreviewUrl);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4 h-[90vh] flex flex-col overflow-hidden z-10"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">Anteprima Documento: {docPreviewName}</h2>
                <button
                  onClick={() => {
                    setDocPreviewOpen(false);
                    URL.revokeObjectURL(docPreviewUrl);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <IconClose />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                {docPreviewUrl && (
                  <iframe
                    src={docPreviewUrl}
                    className="w-full h-full border-none"
                    title="Anteprima Documento"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        open={deleteDocModal.open}
        onClose={() => setDeleteDocModal({ open: false, docId: '', docName: '' })}
        onConfirm={handleDeleteDocumentConfirm}
        entityName="Documento"
        entityLabel={deleteDocModal.docName}
        isDeleting={isDeletingDoc}
      />
    </div>
  );
}
