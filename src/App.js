import { useState, useRef, useEffect } from "react";

// Dynamically load jsPDF
function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf) return resolve(window.jspdf.jsPDF);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => resolve(window.jspdf.jsPDF);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// API key is stored securely as an environment variable in Vercel
// Never hardcode your API key here
const API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

function buildSystemPrompt() {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return `Today's date is ${todayStr}. Always use this date when a document requires today's date — never invent or guess a date.

CRITICAL RULE: When generating any document, NEVER leave placeholder text in the output. Every [bracket] in the templates below must be replaced with real information. If a required field (like a resident's first name) was not provided, derive it from context or ask the user before generating the document. The finished document must read as a complete, ready-to-send letter with no unfilled fields.

You are the MissionOS Operations Assistant for YWCA Cambridge and Cambridge Affordable Housing Corp. (CAHC). YWCA Cambridge is a 103-unit women-only Single Room Occupancy (SRO) affordable housing building at 7 Temple Street, Cambridge, MA 02139. Management contact: Ayahnna Williams, Assistant Housing Manager, awilliams@cambridge-housing.org, (617) 674-5939.

You are a knowledgeable, professional housing operations AI. You help property managers with:
- Drafting YWCA late rent notices and CAHC late rent notices (1st, 2nd, and Final)
- Drafting lease violation notices with correct policy citations
- Compliance questions (HUD HOME, Section 8, MRVP, biennial recertifications)
- Monthly billing for partner programs: Vinfen ($628/unit), BMC ELAHP ($975/unit, $200/mo vacancy after 2 months), BayCove Human Services
- Vendor invoice GL coding: MDS Security (GL 6472), J&JT Maintenance (GL 6542), J&JT Cleaning (GL 6517), J&JT Snow Removal (GL 6475) — all under Property 4118
- Pest control protocols (bed bug IPM with Beauveria bassiana / Aprehend)
- Record retention policies (HUD HOME: 5 years per 24 CFR 92.508)
- Eviction procedures for federally-assisted housing in Massachusetts
- Resident management, occupancy agreement guidance, and weekly roster changes
- Reporting and compliance deadlines

When generating a formal document (notice, letter, invoice summary, report), always:
1. Format it clearly using the exact templates below
2. End the document with: ---DOCUMENT_START--- on its own line, then the full formatted document text, then ---DOCUMENT_END--- on its own line

For conversational questions, respond normally without the document markers.

---

YWCA CAMBRIDGE — LATE RENT NOTICE TEMPLATE
Use this exact format when generating a YWCA late rent notice:

                                                    [Weekday, Month D, YYYY — right-aligned]

[Resident Full Name]
7 Temple Street #[Unit]
Cambridge, MA 02139

                              RE: Urgent Rental Arrears Notice - Action Required

Dear [First Name],

     We are writing to inform you that your rental account is currently past due. According to our records, you have an outstanding balance of [AMOUNT] as of the date of this letter.

     Please note that per your Occupancy Agreement, rent is due on the 1st of each month. Failure to pay rent on time is a violation of your agreement and may result in the initiation of eviction proceedings.

     We strongly urge you to contact the management office immediately to discuss payment arrangements or to remit payment in full. Payments can be made at the management office located at 7 Temple Street, Cambridge, MA 02139 during regular business hours.

     You can also apply for rental assistance via the RAFT program by calling 211 or by going online to Mass.gov/RentalAssistance.

     We are here to help and can discuss possible repayment arrangements. If you have made a payment while this letter was being drafted, please disregard.

Thank you for your immediate attention to this matter.

Sincerely,


Ayahnna Williams
Assistant Housing Manager
awilliams@cambridge-housing.org
(617) 674-5939

CC: Resident File

---

YWCA CAMBRIDGE — LEASE VIOLATION NOTICE TEMPLATE
Use this exact format when generating a lease violation notice. Select the correct WARNING LEVEL: Verbal | 1st Written | 2nd Written | Final Written (default to 1st Written if not specified).

YWCA Cambridge
7 Temple Street | Cambridge, MA 02139

[Date — format: Month D, YYYY]

[Resident Full Name]
Unit [Unit Number]
7 Temple Street
Cambridge, MA 02139

Re: [Short subject — e.g. "Open Flame / Fire Hazard Violation" or "Smoking Violation"]

WARNING LEVEL: [Verbal / 1st Written / 2nd Written / Final Written]

Dear [First Name],

This letter serves as a formal [warning level] notice regarding a violation of your Occupancy Agreement and/or Resident Handbook.

INCIDENT SUMMARY:
[2–4 factual, objective sentences: date, what was observed, who was involved, and why it is a violation. End with: "This conduct must stop immediately."]

POLICY CITATIONS:
[List the relevant sections. Select the applicable ones:]
Smoking / Open Flame:
- Occupancy Agreement §C.11: Prohibition on smoking inside the building or unit
- Smoke-Free Lease Addendum §3: No smoking on the premises
- Resident Handbook: Fire Safety Policy

Noise / Disturbance:
- Occupancy Agreement §C.7: Residents must not disturb the peaceful enjoyment of others
- Resident Handbook: Quiet Hours Policy (10 PM – 8 AM)

Unauthorized Occupant:
- Occupancy Agreement §C.3: Only approved occupants may reside in or regularly use the unit
- Resident Handbook: Guest Policy

Other violations — cite applicable OA section and Resident Handbook section.

REQUIRED ACTION:
[1–2 specific sentences telling the resident exactly what they must do — be concrete, not vague.]

CONSEQUENCES:
Please be advised that continued violations of your Occupancy Agreement may result in escalating disciplinary action, up to and including termination of your housing agreement and eviction proceedings. Per your Occupancy Agreement §F.8, three confirmed written violations within a 12-month period may result in eviction. You have the right to appeal this notice in writing within 7 days of receipt. For questions, contact the management office at (617) 547-9922.

Sincerely,


Ayahnna Williams
Assistant Housing Manager
YWCA Cambridge

CC: Resident File
CC: Property Manager

---

CAHC — LATE RENT NOTICE TEMPLATES
Use these formats when generating a CAHC (Cambridge Affordable Housing Corp.) late rent notice. There are three types — use whichever the user requests (default to 1st Notice):

** 1ST NOTICE **
RE: Urgent Rental Arrears 1st Notice - Action Required

** 2ND NOTICE **
RE: Urgent Rental Arrears 2nd Notice - Action Required

** FINAL NOTICE **
RE: Urgent Rental Arrears Final Notice - Action Required

Use this letter format for all CAHC notice types (swap the RE line above):

                                                    [Weekday, Month D, YYYY — right-aligned]

[Resident Full Name]
Unit [Unit Number], [Property Name]
[Property Address]
Cambridge, MA 02139

                              RE: [appropriate RE line from above]

Dear [First Name],

     We are writing to inform you that your rental account is currently past due. According to our records, you have an outstanding balance of **$[AMOUNT]** as of the date of this letter.

     Please note that per your lease agreement, rent is due on the 1st of each month. Failure to pay rent on time is a violation of your agreement and may result in the initiation of eviction proceedings.

     We strongly urge you to contact the management office immediately to discuss payment arrangements or to remit payment in full.

     You may also apply for rental assistance via the RAFT program by calling 211 or visiting Mass.gov/RentalAssistance.

     If you have made a payment while this letter was being drafted, please disregard this notice.

Thank you for your immediate attention to this matter.

Sincerely,


Ayahnna Williams
Assistant Housing Manager

CC: Resident File

---

POLICY REFERENCE:
- Occupancy Agreement (OA) 2021
- Resident Handbook (HB)
- Smoke-Free Lease Addendum (SFA) effective August 1, 2014
- Violation thresholds (standard): 3 written violations in 12 months → eviction (OA §F.8); minimum 30 days written notice before termination (OA §F.6); 7-day appeal window
- Smoking-specific threshold (SFA §6): Verbal → 1st written → 2nd written + conference → 4th = eviction
- HUD HOME record retention: 5 years (24 CFR 92.508)
- Biennial recertification: required every 2 years for HUD-assisted units; documents must be dated within 120 days of recert effective date
- Section 8 / MRVP: annual inspections required; rent reasonableness determination required

PARTNER PROGRAM BILLING QUICK REFERENCE:
- Vinfen: 11 units, $628/unit subsidy rent; no vacancy payments; prorate mid-month moves (ceiling)
- BMC ELAHP: 15 units, $975/unit; vacancy payment $200/month starts the month after the first full vacant month
- BayCove Human Services: refer to BayCove Unit Tracker for current rates and units
- All invoices use Property code 4118; invoice number format: 4118-MMYYYYPROGRAM

VENDOR GL CODES (Property 4118):
- MDS Security: GL 6472 — Security
- J&JT Maintenance Contract: GL 6542 — Gen. Maint. Service
- J&JT Cleaning Contract: GL 6517 — Cleaning Contract
- J&JT Snow Removal: GL 6475 — Snow Removal

Be concise, professional, and specific to affordable housing nonprofit operations.`;
}

const QUICK_ACTIONS = [
  { label: "YWCA Late Rent Notice", prompt: "Draft a YWCA Cambridge late rent notice. Unit: 231. Resident name: [enter name]. Amount owed: [enter amount]." },
  { label: "CAHC 1st Late Notice", prompt: "Draft a CAHC 1st late rent notice. Property: [enter property name]. Unit: [enter unit]. Resident name: [enter name]. Amount owed: [enter amount]." },
  { label: "Lease Violation", prompt: "Draft a lease violation notice (1st Written) for YWCA Cambridge. Unit: [enter unit]. Resident: [enter name]. Incident: [describe what happened and the date]." },
  { label: "Bed Bug Protocol", prompt: "Give me the bed bug IPM response protocol using Aprehend (Beauveria bassiana), including resident preparation requirements and treatment steps." },
  { label: "Compliance Summary", prompt: "Summarize the key compliance obligations across Section 8, MRVP, and HUD HOME programs at YWCA Cambridge, including inspection and recertification requirements." },
  { label: "Eviction Guide", prompt: "Outline the eviction process steps for a federally-assisted housing property in Massachusetts, including required notices and timelines." },
];

function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6,9 6,2 18,2 18,9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22,2 15,22 11,13 2,9" />
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" rx="6" fill="#00A892" opacity="0.12" />
      <path d="M8 22 L16 10 L24 22" stroke="#00A892" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M11 18 L21 18" stroke="#00A892" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="10" r="2" fill="#00A892" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9,21 9,12 15,12 15,21" />
    </svg>
  );
}

function extractDocument(text) {
  const start = text.indexOf("---DOCUMENT_START---");
  const end = text.indexOf("---DOCUMENT_END---");
  if (start !== -1 && end !== -1) {
    const docText = text.slice(start + 20, end).trim();
    const chatText = text.slice(0, start).trim();
    return { chatText, docText };
  }
  return { chatText: text, docText: null };
}

function DocumentCard({ docText, onPrint, onDownload }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #f0faf8 0%, #e8f7f4 100%)",
      border: "1.5px solid rgba(0,168,146,0.35)",
      borderRadius: "10px",
      padding: "20px",
      marginTop: "12px",
      position: "relative",
      boxShadow: "0 2px 12px rgba(0,168,146,0.08)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ color: "#00A892", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>
          ⬡ Generated Document
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onPrint} style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "#ffffff", border: "1.5px solid rgba(0,168,146,0.3)",
            color: "#00A892", padding: "6px 12px", borderRadius: "6px",
            fontSize: "12px", cursor: "pointer", fontWeight: "600", letterSpacing: "0.5px"
          }}>
            <PrintIcon /> Print
          </button>
          <button onClick={onDownload} style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "#00A892", border: "none",
            color: "#ffffff", padding: "6px 12px", borderRadius: "6px",
            fontSize: "12px", cursor: "pointer", fontWeight: "700", letterSpacing: "0.5px"
          }}>
            <DownloadIcon /> Download PDF
          </button>
        </div>
      </div>
      <div style={{
        background: "#ffffff",
        borderRadius: "6px",
        padding: "16px",
        fontFamily: "'Courier New', monospace",
        fontSize: "12.5px",
        lineHeight: "1.8",
        color: "#2a4a44",
        whiteSpace: "pre-wrap",
        maxHeight: "320px",
        overflowY: "auto",
        border: "1px solid rgba(0,168,146,0.12)"
      }}>
        {docText}
      </div>
    </div>
  );
}

function Message({ msg }) {
  const { chatText, docText } = extractDocument(msg.content);

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>MissionOS Document</title>
      <style>
        body { font-family: Georgia, serif; max-width: 700px; margin: 60px auto; line-height: 1.8; color: #1a1a1a; font-size: 14px; }
        pre { white-space: pre-wrap; font-family: Georgia, serif; }
        @media print { body { margin: 40px; } }
      </style></head>
      <body><pre>${docText}</pre>
      <script>window.onload = () => { window.print(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const handleDownload = async () => {
    try {
      const JsPDF = await loadJsPDF();
      const doc = new JsPDF({ unit: "pt", format: "letter" });
      const margin = 60;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const maxW = pageW - margin * 2;
      const lineH = 15;
      let y = margin;

      doc.setFillColor(0, 168, 146);
      doc.rect(0, 0, pageW, 36, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text("MissionOS  ·  YWCA Cambridge Operations", margin, 23);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      doc.text(dateStr, pageW - margin, 23, { align: "right" });
      y = 70;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);

      const lines = docText.split("\n");
      for (const rawLine of lines) {
        const trimmed = rawLine.trimEnd();
        const isHeading = (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 60 && /[A-Z]/.test(trimmed))
          || /^(Dear |To:|From:|Re:|Date:|Subject:|RE:)/i.test(trimmed);

        if (isHeading) { doc.setFont("helvetica", "bold"); doc.setFontSize(11); }
        else { doc.setFont("helvetica", "normal"); doc.setFontSize(11); }

        if (trimmed === "") { y += lineH * 0.6; continue; }

        const wrapped = doc.splitTextToSize(trimmed, maxW);
        for (const wl of wrapped) {
          if (y + lineH > pageH - margin) {
            doc.addPage();
            doc.setFillColor(0, 168, 146);
            doc.rect(0, 0, pageW, 36, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(255, 255, 255);
            doc.text("MissionOS  ·  YWCA Cambridge Operations", margin, 23);
            doc.setTextColor(30, 30, 30);
            y = 70;
            if (isHeading) { doc.setFont("helvetica", "bold"); }
            else { doc.setFont("helvetica", "normal"); }
            doc.setFontSize(11);
          }
          doc.text(wl, margin, y);
          y += lineH;
        }
      }

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text("Generated by MissionOS · Confidential · YWCA Cambridge", pageW / 2, pageH - 24, { align: "center" });

      const filename = `MissionOS_Document_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (err) {
      const blob = new Blob([docText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "MissionOS_Document.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: msg.role === "user" ? "row-reverse" : "row",
      gap: "10px",
      marginBottom: "20px",
      alignItems: "flex-start"
    }}>
      {msg.role === "assistant" && (
        <div style={{
          width: "32px", height: "32px", borderRadius: "8px",
          background: "linear-gradient(135deg, #00A892, #007d6a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: "2px"
        }}>
          <span style={{ fontSize: "14px", color: "#fff" }}>M</span>
        </div>
      )}
      <div style={{ maxWidth: "78%", minWidth: "120px" }}>
        <div style={{
          background: msg.role === "user"
            ? "linear-gradient(135deg, #00A892, #007d6a)"
            : "#ffffff",
          borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          padding: "12px 16px",
          color: msg.role === "user" ? "#ffffff" : "#1a2e2b",
          fontSize: "14px",
          lineHeight: "1.65",
          fontWeight: msg.role === "user" ? "600" : "400",
          border: msg.role === "assistant" ? "1px solid rgba(0,0,0,0.07)" : "none",
          boxShadow: msg.role === "assistant" ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
          whiteSpace: "pre-wrap"
        }}>
          {chatText}
        </div>
        {docText && (
          <DocumentCard docText={docText} onPrint={handlePrint} onDownload={handleDownload} />
        )}
      </div>
    </div>
  );
}

export default function MissionOSPortal() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const resetChat = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
  };

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 2048,
          system: buildSystemPrompt(),
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f0faf8 0%, #ffffff 50%, #f5fffe 100%)",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
      color: "#1a2e2b"
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid rgba(0,168,146,0.2)",
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 10,
        boxShadow: "0 1px 12px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <LogoIcon />
          <div>
            <div style={{ fontWeight: "800", fontSize: "16px", color: "#1a2e2b", letterSpacing: "-0.3px" }}>
              Mission<span style={{ color: "#00A892" }}>OS</span>
            </div>
            <div style={{ fontSize: "10px", color: "#7aada4", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: "-1px" }}>
              YWCA Cambridge · Operations Portal
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {!isEmpty && (
            <button onClick={resetChat} style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(0,168,146,0.08)", border: "1px solid rgba(0,168,146,0.25)",
              borderRadius: "20px", padding: "5px 12px", cursor: "pointer",
              color: "#00A892", fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px"
            }}>
              <HomeIcon /> New Chat
            </button>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(0,168,146,0.08)", border: "1px solid rgba(0,168,146,0.25)",
            borderRadius: "20px", padding: "5px 12px"
          }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00A892", boxShadow: "0 0 6px rgba(0,168,146,0.6)" }} />
            <span style={{ fontSize: "11px", color: "#00A892", fontWeight: "600", letterSpacing: "0.5px" }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", maxWidth: "860px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {isEmpty && (
          <div style={{ textAlign: "center", paddingTop: "40px", paddingBottom: "32px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(0,168,146,0.15), rgba(0,168,146,0.05))",
              border: "1px solid rgba(0,168,146,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: "28px"
            }}>🏢</div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#1a2e2b", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
              Welcome to MissionOS
            </h2>
            <p style={{ color: "#7aada4", fontSize: "14px", margin: "0 0 32px", lineHeight: "1.6" }}>
              Your AI-powered operations assistant for YWCA Cambridge.<br />
              Ask a question or generate a document below.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", maxWidth: "640px", margin: "0 auto" }}>
              {QUICK_ACTIONS.map((action) => (
                <button key={action.label} onClick={() => sendMessage(action.prompt)} style={{
                  background: "#ffffff", border: "1px solid rgba(0,168,146,0.2)",
                  borderRadius: "10px", padding: "12px 14px", color: "#3a6e68",
                  fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  textAlign: "left", letterSpacing: "0.2px", transition: "all 0.2s",
                  lineHeight: "1.4", boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                }}
                  onMouseEnter={e => { e.target.style.background = "rgba(0,168,146,0.08)"; e.target.style.borderColor = "rgba(0,168,146,0.4)"; e.target.style.color = "#00A892"; }}
                  onMouseLeave={e => { e.target.style.background = "#ffffff"; e.target.style.borderColor = "rgba(0,168,146,0.2)"; e.target.style.color = "#3a6e68"; }}
                >{action.label}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "flex-start" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #00A892, #007d6a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "14px", color: "#fff" }}>M</span>
            </div>
            <div style={{ background: "#ffffff", borderRadius: "4px 16px 16px 16px", padding: "14px 18px", border: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: "6px", alignItems: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00A892", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "16px 24px 20px", borderTop: "1px solid rgba(0,168,146,0.12)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", boxShadow: "0 -1px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", position: "relative" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about compliance, generate a notice, look up a protocol…"
            rows={1}
            style={{ width: "100%", background: "#f5faf9", border: "1.5px solid rgba(0,168,146,0.25)", borderRadius: "12px", padding: "14px 52px 14px 18px", color: "#1a2e2b", fontSize: "14px", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: "1.5", boxSizing: "border-box", transition: "border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor = "#00A892"}
            onBlur={e => e.target.style.borderColor = "rgba(0,168,146,0.25)"}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", width: "34px", height: "34px", borderRadius: "8px", background: input.trim() && !loading ? "#00A892" : "rgba(0,168,146,0.12)", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", color: input.trim() && !loading ? "#ffffff" : "#a0cec8", transition: "all 0.2s" }}>
            <SendIcon />
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: "10px", color: "#b0d0cc", margin: "10px 0 0", letterSpacing: "0.5px" }}>
          MISSIONOS · POWERED BY ANTHROPIC · YWCA CAMBRIDGE OPERATIONS
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        textarea::placeholder { color: #9abfba; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,168,146,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}
