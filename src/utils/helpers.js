import { C } from './constants';

let idCounter = 1000;

export const uid = (p) => `${p}-${(idCounter++).toString(36)}`;

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

export const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));

export const classify = (score) => (score >= 71 ? "High" : score >= 41 ? "Moderate" : "Low");

export const riskColor = (level) => {
  if (level === "High") return C.high;
  if (level === "Moderate") return C.moderate;
  return C.low;
};

export const riskBg = (level) => {
  if (level === "High") return C.highBg;
  if (level === "Moderate") return C.moderateBg;
  return C.lowBg;
};

export const computeBMI = (h, w) => {
  if (h && w) {
    return +(w / ((h / 100) * (h / 100))).toFixed(1);
  }
  return 0;
};

export const printPDFReport = (title, contentHTML) => {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 30px; color: #122420; background: #fff; }
          .header { text-align: center; border-bottom: 3px solid #0E7C5A; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { color: #0E7C5A; margin: 0; font-size: 24px; }
          .header p { color: #5C7069; margin: 5px 0 0 0; font-size: 12px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px; }
          .badge-low { background: #E9F8EF; color: #1E9E5A; }
          .badge-high { background: #FBE9E9; color: #D64545; }
          .badge-mod { background: #FDF3E0; color: #C67C0E; }
          .section { margin-bottom: 20px; padding: 15px; border: 1px solid #DEE9E4; border-radius: 8px; }
          .section-title { font-size: 14px; font-weight: bold; color: #0A5C43; border-bottom: 1px solid #DEE9E4; padding-bottom: 5px; margin-bottom: 10px; }
          ul { margin: 5px 0 0 20px; padding: 0; font-size: 13px; color: #334155; }
          li { margin-bottom: 6px; }
          .footer { margin-top: 30px; border-top: 1px solid #DEE9E4; pt: 10px; font-size: 11px; color: #8CA098; text-align: center; }
          @media print {
            body { margin: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HealthSense AI Screening & Referral Report</h1>
          <p>Hospital Early NCD Detection & Clinical Assessment Platform</p>
        </div>
        ${contentHTML}
        <div class="footer">
          Report generated electronically on ${new Date().toLocaleString()} · HealthSense AI Medical Engine
        </div>
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
