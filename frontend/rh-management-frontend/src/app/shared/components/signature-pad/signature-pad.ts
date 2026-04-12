import {
  Component, ElementRef, EventEmitter, Input,
  OnDestroy, OnInit, Output, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SignatureResult {
  signedBy: string;
  signedAt: string;         // ISO timestamp
  signatureImage: string;   // base64 PNG
}

export interface LeaveRequestSummary {
  refNo:      string;
  employeeNom: string;
  type:       string;
  dateDebut:  string;
  dateFin:    string;
  motif:      string;
}

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signature-pad.html',
  styleUrls: ['./signature-pad.css']
})
export class SignaturePad implements OnInit, OnDestroy {

  @Input() request!: LeaveRequestSummary;
  @Input() signatoryName = 'Responsable';

  @Output() signed   = new EventEmitter<SignatureResult>();
  @Output() rejected = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private lastX = 0;
  private lastY = 0;
  isEmpty = true;

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.lineWidth   = 2;
    this.ctx.lineCap     = 'round';
    this.ctx.lineJoin    = 'round';
    this.ctx.strokeStyle = '#2a2d32';
    this.resizeCanvas();
  }

  ngOnDestroy(): void {}

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const rect   = canvas.parentElement!.getBoundingClientRect();
    canvas.width  = rect.width  || 560;
    canvas.height = 160;
    // Re-apply style after resize wipes context state
    this.ctx.lineWidth   = 2;
    this.ctx.lineCap     = 'round';
    this.ctx.lineJoin    = 'round';
    this.ctx.strokeStyle = '#2a2d32';
  }

  // ── Drawing events ─────────────────────────────────────────
  private getPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect   = canvas.getBoundingClientRect();
    if (e instanceof MouseEvent) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    const touch = e.touches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  onPointerDown(e: MouseEvent | TouchEvent): void {
    e.preventDefault();
    this.drawing = true;
    const { x, y } = this.getPos(e);
    this.lastX = x; this.lastY = y;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 1, 0, Math.PI * 2);
    this.ctx.fillStyle = '#2a2d32';
    this.ctx.fill();
    this.isEmpty = false;
  }

  onPointerMove(e: MouseEvent | TouchEvent): void {
    if (!this.drawing) return;
    e.preventDefault();
    const { x, y } = this.getPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.lastX = x; this.lastY = y;
  }

  onPointerUp(): void {
    this.drawing = false;
  }

  clearSignature(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.isEmpty = true;
  }

  // ── Actions ───────────────────────────────────────────────
  confirmSignature(): void {
    if (this.isEmpty) return;
    const canvas = this.canvasRef.nativeElement;
    const result: SignatureResult = {
      signedBy: this.signatoryName,
      signedAt: new Date().toISOString(),
      signatureImage: canvas.toDataURL('image/png')
    };
    this.signed.emit(result);
    this.generatePDF(result);
  }

  rejectRequest(): void {
    this.rejected.emit();
  }

  // ── PDF generation ────────────────────────────────────────
  async generatePDF(sig: SignatureResult): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const doc    = new jsPDF({ unit: 'mm', format: 'a4' });
    const orange: [number,number,number] = [255, 88, 0];
    const teal:   [number,number,number] = [13, 119, 110];
    const gray:   [number,number,number] = [94, 97, 103];
    const dark:   [number,number,number] = [42, 45, 50];

    // ── Header band
    doc.setFillColor(...orange);
    doc.rect(0, 0, 210, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('alBaraka Assurances — Takaful Tunisie', 10, 10);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Direction des Ressources Humaines', 10, 16);

    // ── APPROUVÉ watermark (rotated)
    doc.setTextColor(13, 119, 110);
    doc.setFontSize(52); doc.setFont('helvetica', 'bold');
    doc.setGState(doc.GState({ opacity: 0.07 }));
    doc.text('APPROUVÉ', 50, 180, { angle: 40 });
    doc.setGState(doc.GState({ opacity: 1 }));

    // ── Document title
    doc.setTextColor(...dark);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('Demande de congé — Récapitulatif', 10, 36);

    // ── Divider
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.5);
    doc.line(10, 40, 200, 40);

    // ── Request details
    const details: [string, string][] = [
      ['Référence',       this.request.refNo],
      ['Employé',         this.request.employeeNom],
      ['Type de congé',   this.request.type],
      ['Date de début',   this.request.dateDebut],
      ['Date de fin',     this.request.dateFin],
      ['Motif',           this.request.motif],
      ['Statut',          'APPROUVÉ'],
    ];

    let y = 52;
    details.forEach(([label, val]) => {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...gray);
      doc.text(label + ' :', 12, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...dark);
      doc.text(val, 65, y);
      y += 8;
    });

    // ── Signature block
    y += 6;
    doc.setDrawColor(...teal);
    doc.setFillColor(...teal);
    doc.rect(10, y, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Signature électronique du responsable', 12, y + 5.5);
    y += 14;

    doc.setTextColor(...gray); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Signataire : ${sig.signedBy}`, 12, y);
    doc.text(`Date/Heure : ${new Date(sig.signedAt).toLocaleString('fr-TN')}`, 12, y + 6);

    // Embed signature image
    doc.addImage(sig.signatureImage, 'PNG', 12, y + 12, 80, 30);

    // ── Footer
    doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text('Document généré automatiquement — alBaraka Assurances RH', 10, 285);
    doc.text(`Réf. ${this.request.refNo} — ${new Date().toLocaleDateString('fr-TN')}`, 150, 285);

    doc.save(`conge_approuve_${this.request.refNo}.pdf`);
  }
}
