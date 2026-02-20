import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';
import * as QRCode from 'qrcode';

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private readonly host: string;
  private readonly port: number;
  /** 203 DPI Zebra → 8 dots/mm */
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
    const qrData = `${appUrl}/m/${machineId}`;
    const sn   = (serialNumber || '').substring(0, 20);
    const desc = (description  || '').substring(0, 32);
    const mf   = (manufacturer || '').substring(0, 20);
    const mo   = (model        || '').substring(0, 20);

    // Genera GFA dal QR code
    const qrSizeDots = 500; // ~62mm a 203 DPI
    const gfa = await this.qrToGfa(qrData, qrSizeDots);

    const zpl = [
      '^XA',
      '^PON',
      '^PW608',
      '^LL1392',
      '^LH0,0',

      // QR code bitmap ^GFA — spostato 5mm verso top (40 dots in meno su Y feed)
      `^FO30,0${gfa}`,

      // Linea orizzontale separatrice
      '^FO40,560^GB520,4,4,B^FS',

      // Matricola — grande
      `^FO403,607^A0R,96,106^FD${sn}^FS`,

      // Modello
      `^FO280,616^A0R,40,40^FD${mo}^FS`,

      // Produttore
      `^FO118,613^A0R,40,40^FD${mf}^FS`,

      '^XZ',
    ].join('\n');

    this.logger.log(`ZPL macchina [${sn}]:\n${zpl.substring(0, 300)}...`);
    return this.sendZpl(zpl);
  }

  /**
   * Genera un QR code come stringa ^GFA (Zebra Graphics Field ASCII)
   * pronta da inserire nel ZPL dopo ^FO.
   *
   * Il QR viene renderizzato come matrice di pixel B&W, poi convertito
   * in bytes packed (1 bit per pixel) e codificati in hex uppercase.
   */
  private async qrToGfa(data: string, sizeDots: number): Promise<string> {
    // Genera QR come raw bitmap: array di pixel RGBA
    const raw = await QRCode.toBuffer(data, {
      type: 'png',
      width: sizeDots,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });

    // Decodifica PNG manualmente: qrcode restituisce un PNG buffer.
    // Usiamo la libreria built-in di Node per estrarre i pixel.
    // Poiché non abbiamo sharp, usiamo qrcode con rendererType raw.
    const matrix = await this.getQrMatrix(data);
    return this.matrixToGfa(matrix, sizeDots);
  }

  /**
   * Ottiene la matrice booleana del QR (true = modulo scuro)
   */
  private async getQrMatrix(data: string): Promise<boolean[][]> {
    // qrcode espone create() che restituisce la struttura interna
    const qr = QRCode.create(data, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const matrix: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      matrix[r] = [];
      for (let c = 0; c < size; c++) {
        matrix[r][c] = qr.modules.get(r, c) === 1;
      }
    }
    return matrix;
  }

  /**
   * Converte matrice QR in stringa ^GFA per ZPL.
   * Scala la matrice al numero di dots desiderato.
   *
   * ^GFA,<total bytes>,<total bytes>,<bytes per row>,<hex data>
   */
  private matrixToGfa(matrix: boolean[][], sizeDots: number): string {
    const modules = matrix.length;
    // Quanti dots per modulo (arrotondato)
    const scale = Math.floor(sizeDots / modules);
    const actualSize = modules * scale;

    // Bytes per riga: 1 bit per pixel, arrotondato al byte superiore
    const bytesPerRow = Math.ceil(actualSize / 8);
    const rows: string[] = [];

    for (let r = 0; r < modules; r++) {
      // Costruisce la riga di pixel come array di bit
      const bits: number[] = new Array(bytesPerRow * 8).fill(0);
      for (let c = 0; c < modules; c++) {
        if (matrix[r][c]) {
          for (let s = 0; s < scale; s++) {
            bits[c * scale + s] = 1;
          }
        }
      }
      // Pack bits → hex
      let rowHex = '';
      for (let b = 0; b < bytesPerRow; b++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          byte = (byte << 1) | (bits[b * 8 + bit] || 0);
        }
        rowHex += byte.toString(16).padStart(2, '0').toUpperCase();
      }
      // Ripeti la riga per i dot di scala verticale
      for (let s = 0; s < scale; s++) {
        rows.push(rowHex);
      }
    }

    const hexData = rows.join('');
    const totalBytes = bytesPerRow * rows.length;

    return `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hexData}^FS`;
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
