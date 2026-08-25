import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(patient, screening, risk_pred, review) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    # Title & Hospital Header
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#064E3B'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )

    story.append(Paragraph("HealthSense AI Medical Center", title_style))
    story.append(Paragraph("Institute for Non-Communicable Disease Early Screening & Epidemiology", subtitle_style))
    story.append(Spacer(1, 10))

    # Patient Information Table
    p_data = [
        [Paragraph("<b>Patient Name:</b> " + patient.name, styles['Normal']), Paragraph("<b>Patient ID:</b> " + patient.patient_id, styles['Normal'])],
        [Paragraph("<b>Age / Gender:</b> " + str(patient.age) + " yrs / " + patient.gender, styles['Normal']), Paragraph("<b>Phone:</b> " + (patient.phone or "N/A"), styles['Normal'])],
        [Paragraph("<b>Blood Pressure:</b> " + (screening.blood_pressure if screening else "120/80"), styles['Normal']), Paragraph("<b>BMI Metric:</b> " + str(screening.bmi if screening else "24.2") + " kg/m²", styles['Normal'])]
    ]
    t_patient = Table(p_data, colWidths=[260, 260])
    t_patient.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_patient)
    story.append(Spacer(1, 15))

    # Risk Prediction Breakdown Header
    story.append(Paragraph("<b>AI Machine-Learning Risk Prediction Breakdown</b>", styles['Heading2']))
    story.append(Spacer(1, 6))

    if risk_pred:
        r_data = [
            ["Disease Category", "Risk Score", "Risk Tier"],
            ["Type 2 Diabetes", f"{risk_pred.diabetes_risk}%", "Elevated" if risk_pred.diabetes_risk > 50 else "Normal"],
            ["Hypertension", f"{risk_pred.hypertension_risk}%", "Elevated" if risk_pred.hypertension_risk > 50 else "Normal"],
            ["CVD", f"{risk_pred.cvd_risk}%", "Elevated" if risk_pred.cvd_risk > 50 else "Normal"],
            ["Stroke", f"{risk_pred.stroke_risk}%", "Elevated" if risk_pred.stroke_risk > 50 else "Normal"],
            ["Chronic Kidney Disease (CKD)", f"{risk_pred.ckd_risk}%", "Elevated" if risk_pred.ckd_risk > 50 else "Normal"],
            ["OVERALL COMPOSITE RISK", f"{risk_pred.overall_risk}%", risk_pred.risk_level.upper()]
        ]
    else:
        r_data = [["No risk prediction data recorded.", "", ""]]

    t_risk = Table(r_data, colWidths=[220, 150, 150])
    t_risk.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#064E3B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_risk)
    story.append(Spacer(1, 15))

    # Doctor Review Remarks
    story.append(Paragraph("<b>Physician Clinical Remarks & Diagnosis</b>", styles['Heading3']))
    story.append(Spacer(1, 4))
    remarks_text = review.remarks if (review and review.remarks) else "Patient exhibits Non-Communicable Disease elevated risk indicators. Clinical lifestyle modification & follow-up recommended."
    story.append(Paragraph(f"<i>{remarks_text}</i>", styles['Normal']))
    story.append(Spacer(1, 25))

    # Signature Footer
    story.append(Paragraph("<b>Attending Physician Signature:</b> Dr. Arjun Mehta, MD (Cardiology)", styles['Normal']))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
