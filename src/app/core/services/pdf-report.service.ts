import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { InvestmentTypeReport } from '../models/investment.model';
import { formatINR, formatMonth } from '../utilities/helpers';

@Injectable({ providedIn: 'root' })
export class PdfReportService {
  async downloadInvestmentReport(
    report: InvestmentTypeReport,
    chartElement: HTMLElement | null
  ): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Investment Tracker', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Investment Report', margin, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(report.investmentName, margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Type: ${report.investmentType}`, margin, y);
    y += 5;
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })}`,
      margin,
      y
    );
    y += 8;
    doc.setTextColor(0);
    doc.setDrawColor(180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Investment Summary', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const rows: [string, string][] = [
      ['Total Invested', formatINR(report.totalInvested)],
      ['Contributions', String(report.contributionCount)],
      ['Average Contribution', formatINR(report.averageContribution)],
      [
        'Duration',
        report.firstMonth && report.lastMonth
          ? `${formatMonth(report.firstMonth)} – ${formatMonth(report.lastMonth)}`
          : `${report.durationMonths} month(s)`,
      ],
    ];
    if (report.highestContribution) {
      rows.push([
        'Highest Contribution',
        `${formatINR(report.highestContribution.amount)} (${formatMonth(report.highestContribution.month)})`,
      ]);
    }
    if (
      report.lowestContribution &&
      report.highestContribution &&
      report.lowestContribution.month !== report.highestContribution.month
    ) {
      rows.push([
        'Lowest Contribution',
        `${formatINR(report.lowestContribution.amount)} (${formatMonth(report.lowestContribution.month)})`,
      ]);
    }

    for (const [label, value] of rows) {
      ensureSpace(6);
      doc.text(label, margin, y);
      doc.text(value, pageWidth - margin, y, { align: 'right' });
      y += 6;
    }

    y += 4;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Investment Graph', margin, y);
    y += 6;

    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#12121a',
          scale: 2,
          logging: false,
        });
        const img = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        ensureSpace(Math.min(imgHeight, pageHeight - margin * 2));
        const drawHeight = Math.min(imgHeight, pageHeight - y - margin);
        doc.addImage(img, 'PNG', margin, y, imgWidth, drawHeight);
        y += drawHeight + 8;
      } catch (e) {
        console.error(e);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('(Chart could not be rendered in this PDF)', margin, y);
        y += 8;
      }
    }

    ensureSpace(20);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Analysis', margin, y);
    y += 8;

    for (const section of [
      { title: 'Overview', lines: report.analysis.overview },
      { title: 'Trend', lines: report.analysis.trends },
      { title: 'Performance', lines: report.analysis.performance },
    ]) {
      if (!section.lines.length) continue;
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(section.title, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      for (const line of section.lines) {
        const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2);
        ensureSpace(wrapped.length * 5 + 2);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 5 + 2;
      }
      y += 2;
    }

    doc.save(
      `investory-${report.investmentName.toLowerCase().replace(/\s+/g, '-')}-report.pdf`
    );
  }
}
