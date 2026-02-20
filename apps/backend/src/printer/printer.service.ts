import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as net from 'net';

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private readonly host: string;
  private readonly port: number;
  /** dots per mm — 203 DPI Zebra ZT410 */
  private readonly dpmm = 8;

  constructor(private configService: ConfigService) {
    this.host = this.configService.get<string>('PRINTER_HOST', '192.168.3.44');
    this.port = this.configService.get<number>('PRINTER_PORT', 9100);
  }

  /**
   * Genera e invia etichetta macchina 174×76mm:
   *  - QR code a sinistra (link /m/:id)
   *  - Matricola | Descrizione | Produttore Modello a destra
   */
  async printMachineLabel(
    machineId: string,
    serialNumber: string,
    description: string,
    manufacturer: string,
    model: string,
    appUrl: string,
  ): Promise<{ success: boolean; message: string }> {
    const qrData = `${appUrl}/m/${machineId}`;
    const desc = (description || '').substring(0, 28);
    const mfModel = `${manufacturer || ''} ${model || ''}`.trim().substring(0, 28);

    const d = this.dpmm;
    // Label 174×76mm → 1392×608 dots (landscape: stampante riceve rolled 76mm)
    // Coordinate mapping: printerX = editorY * d, printerY = editorX * d
    // Elementi posizionati come in CoreCanvas (editor coords mm):
    //   qrcode: x=5,y=5,w=62,h=62  → in ZPL: FO(y*d),(x*d) → FO40,40; size=62*8=496
    //   serialNumber: x=72,y=5      → FO40,576
    //   description:  x=72,y=32     → FO256,576
    //   mfModel:      x=72,y=52     → FO416,576

    const labelWidthDots = Math.round(76 * d);   // 608 (roll width)
    const labelLengthDots = Math.round(174 * d); // 1392 (feed length)
    const qrMag = 4;

    const zpl = [
      '^XA',
      '^PON',
      `^PW${labelWidthDots}`,
      `^LL${labelLengthDots}`,
      '^LH0,0',
      // QR code (coordinate stampante: FO editorY*d, editorX*d)
      `^FO${5 * d},${5 * d}^BQN,2,${qrMag}^FDM,${qrData}^FS`,
      // Matricola bold (rotazione N = già ruotato dalla mappatura)
      `^FO${5 * d},${72 * d}^A0N,${22 * d},${22 * d}^FD${serialNumber}^FS`,
      // Descrizione
      `^FO${32 * d},${72 * d}^A0N,${13 * d},${13 * d}^FD${desc}^FS`,
      // Produttore + Modello
      `^FO${52 * d},${72 * d}^A0N,${12 * d},${12 * d}^FD${mfModel}^FS`,
      '^PQ1',
      '^XZ',
    ].join('\n');

    this.logger.debug(`ZPL generato:\n${zpl}`);
    return this.sendZpl(zpl);
  }

  private sendZpl(zpl: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 10_000;

      socket.setTimeout(timeout);

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
        this.logger.error(`Connessione stampante fallita: ${err.message}`);
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
