import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private readonly host: string;
  private readonly port: number;

  /**
   * 203 DPI Zebra → 8 dots/mm
   * Roll: 76mm wide  → 608 dots  (asse X, larghezza fisica)
   * Feed: 174mm long → 1392 dots (asse Y, lunghezza fisica)
   *
   * Layout etichetta (vista landscape, orientata con QR a sinistra):
   *
   *   ┌─────────────────────────────────────────────────────┐
   *   │         │                                           │
   *   │  QR     │  SN-2024-001   (matricola grande)        │
   *   │  60×60  │  ══════════════════════════              │
   *   │         │  Fresatrice CNC verticale                │
   *   │         │  Mazak  ·  VTC-800                       │
   *   └─────────────────────────────────────────────────────┘
   *    ← 68mm → 2mm ←──────────── 104mm ──────────────────→
   *
   * Il roll esce in portrait (76mm wide), quindi usiamo rotazione ^A0R
   * (90° CW) per il testo: le Y del testo diventano la X fisica.
   *
   * Convenzione coordinate usate qui: (col, row) in mm, landscape logico
   *   col = asse lungo etichetta (0→174mm) → maps to ZPL ^FO Y (feed)
   *   row = asse corto etichetta (0→76mm)  → maps to ZPL ^FO X (width)
   *
   * Con rotazione R:  FO(col*d, (76-row)*d) oppure più semplicemente
   * partiamo da row=0 = bordo superiore quando l'etichetta è landscape.
   * ^A0R posiziona il testo ruotato: X è il bordo sinistro del testo
   * lungo l'asse width (scende), Y è la posizione lungo l'asse feed.
   *
   * Per semplicità usiamo coordinate dirette in dots, testate empiricamente:
   *   - ^FO <x_dots>, <y_dots>  con x = posizione sul roll (0=left, 608=right)
   *                                   y = posizione feed   (0=top, 1392=bottom)
   *   - Testo con ^A0R: il carattere cresce verso x crescente (giù nel roll)
   *     e si posiziona partendo da y (lungo il feed)
   */
  private readonly dpmm = 8;

  constructor(private configService: ConfigService) {
    this.host = this.configService.get<string>('PRINTER_HOST', '192.168.3.44');
    this.port = this.configService.get<number>('PRINTER_PORT', 9100);
  }

  async printMachineLabel(
    machineId: string,
    serialNumber: string,
    description: string,
    manufacturer: string,
    model: string,
    appUrl: string,
  ): Promise<{ success: boolean; message: string }> {
    const d = this.dpmm;
    const qrData = `${appUrl}/m/${machineId}`;

    // Tronca testi per evitare overflow
    const sn   = (serialNumber || '').substring(0, 20);
    const desc = (description  || '').substring(0, 32);
    const mf   = `${manufacturer || ''} ${model || ''}`.trim().substring(0, 32);

    // Dimensioni etichetta in dots
    const pw = 76  * d;  // 608  — print width (larghezza roll)
    const ll = 174 * d;  // 1392 — label length (feed)

    // ── QR CODE ──────────────────────────────────────────────────────────
    // Posizionato in alto-sinistra (landscape), magnification 5 → ~60×60mm
    // ^FO x,y → x=margin sinistro (roll), y=margin top (feed)
    const qrX   = 4 * d;   // 32 dots dal bordo sinistro roll
    const qrY   = 4 * d;   // 32 dots dal top feed
    const qrMag = 5;        // magnification 5 = ~50×50mm

    // ── LINEA VERTICALE SEPARATRICE ───────────────────────────────────────
    // ^GB larghezza, altezza, spessore
    // Linea verticale: larghezza=spessore (3 dots), altezza=tutta l'etichetta
    const lineX = 70 * d;  // 560 dots — a 70mm dal bordo sinistro
    const lineY = 0;
    const lineH = ll;       // tutta la lunghezza
    const lineT = 3;        // 3 dots spessore

    // ── TESTI (rotazione R = 90° CW, leggibili landscape) ─────────────────
    // Con ^A0R il testo "cresce" verso x positivo (verso il basso nel roll)
    // x = posizione verticale nel roll (row)
    // y = posizione orizzontale nel feed (colonna)

    // Matricola: grande, partenza 4mm dal top roll, 74mm dal top feed
    const snSize = 14 * d;  // 112 dots ≈ 14mm font
    const snX    = 4 * d;   // 32 dots dal bordo top roll
    const snY    = 74 * d;  // 592 dots dal top feed (dopo la linea ~70mm + 4mm margin)

    // Linea orizzontale sotto matricola
    const hlY    = snY + snSize + (2 * d);  // 2mm sotto il testo
    const hlX    = 4 * d;
    const hlW    = (174 - 74 - 4) * d;     // larghezza zona testo in dots
    const hlH    = 3;

    // Descrizione: 10mm font
    const descSize = 9 * d;
    const descX    = 4 * d;
    const descY    = snY + snSize + (6 * d);

    // Produttore · Modello: 8mm font
    const mfSize = 8 * d;
    const mfX    = 4 * d;
    const mfY    = descY + descSize + (4 * d);

    const zpl = [
      '^XA',
      `^PW${pw}`,
      `^LL${ll}`,
      '^LH0,0',

      // QR code (nessuna rotazione necessaria, è simmetrico)
      `^FO${qrX},${qrY}^BQN,2,${qrMag}^FDM,${qrData}^FS`,

      // Linea verticale separatrice
      `^FO${lineX},${lineY}^GB${lineT},${lineH},${lineT}^FS`,

      // Matricola (testo ruotato 90° CW con ^A0R)
      `^FO${snX},${snY}^A0R,${snSize},${snSize}^FD${sn}^FS`,

      // Linea orizzontale sotto matricola
      `^FO${hlX},${hlY}^GB${hlW},${hlH},${hlH}^FS`,

      // Descrizione
      `^FO${descX},${descY}^A0R,${descSize},${descSize}^FD${desc}^FS`,

      // Produttore · Modello
      `^FO${mfX},${mfY}^A0R,${mfSize},${mfSize}^FD${mf}^FS`,

      '^PQ1',
      '^XZ',
    ].join('\n');

    this.logger.log(`ZPL etichetta macchina ${sn}:\n${zpl}`);
    return this.sendZpl(zpl);
  }

  private sendZpl(zpl: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(10_000);

      socket.connect(this.port, this.host, () => {
        socket.write(zpl, 'utf-8', (err) => {
          if (err) {
            socket.destroy();
            this.logger.error(`Errore invio ZPL: ${err.message}`);
            resolve({ success: false, message: `Errore invio: ${err.message}` });
          } else {
            socket.end();
            resolve({ success: true, message: 'Etichetta inviata alla stampante' });
          }
        });
      });

      socket.on('error', (err) => {
        socket.destroy();
        this.logger.error(`Stampante non raggiungibile: ${err.message}`);
        resolve({ success: false, message: `Stampante non raggiungibile: ${err.message}` });
      });

      socket.on('timeout', () => {
        socket.destroy();
        this.logger.error('Timeout connessione stampante');
        resolve({ success: false, message: 'Timeout connessione stampante' });
      });
    });
  }
}
