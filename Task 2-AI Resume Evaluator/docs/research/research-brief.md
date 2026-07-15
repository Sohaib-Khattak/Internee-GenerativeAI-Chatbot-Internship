# 🔬 AI Resume Evaluator — Research Brief

> Compiled: 2026-07-14 | Sources: 6 parallel research agents (competitor analysis, resume parsing, AI evaluation, bias/fairness, UX patterns, file architecture)

---

## 1. 🏢 Competitive Landscape Summary

| Tool | Score/Check | ATS Intelligence | Pricing | Key Differentiator |
|------|------------|-----------------|---------|-------------------|
| **Rezi** | Score 1-100 (23 criteria) | 23+ ATS checkpoints | $29/mo | Purpose-built AI, human review included |
| **Jobscan** | ATS Match Rate (target 75%) | Per-ATS detection (iCIMS/Lever/Greenhouse) | ~$5-30/mo | Reverse-engineered ATS rules |
| **Kickresume** | DB comparison + AI feedback | Generic tips | $3.60-15/mo | GPT-4.1, website builder, mobile apps |
| **SkillSyncer** | Instant Match Score (12+ criteria) | Multi-factor | $14.95/mo | Budget-friendly, .edu/.mil free 1yr |
| **Resume.io** | Template compliance only | Template-level warnings | $29.95/4wk | Career coaching bundle |
| **TopResume** | Human expert, not AI | Via writers | $24.95/mo DIY | Professional human writers |

### 🔑 Market Gaps We Can Exploit
1. **Explainable AI** — No competitor shows *why* a score was given with specific evidence
2. **Bias transparency** — None mention bias detection or fairness metrics
3. **Actionable roadmap** — Scores without improvement plans are just ratings
4. **Truly free tier** — All "free" tiers are heavily restricted
5. **Job-specific evaluation** — Most do keyword matching; none do deep role-fit analysis

---

## 2. 🤖 AI Evaluation Approach — Recommendations

### Prompt Architecture
```
System: You are an expert resume reviewer with 15+ years in tech hiring.
        Evaluate based on these criteria: [rubric].
        Flag any potential bias. Return structured JSON.

User: Resume: [extracted text]
      Target Role: [optional job description]
```

### Scoring Rubric (recommended categories)
| Category | Weight | What it measures |
|----------|--------|-----------------|
| Experience Relevance | 30% | Alignment with target role |
| Skills & Keywords | 25% | Hard skills, tools, technologies mentioned |
| Achievements | 15% | Quantified impact, results |
| Education & Cert | 10% | Credentials relevance |
| Format & Clarity | 10% | Readability, structure, conciseness |
| ATS Compatibility | 10% | Parsability, keyword density, layout |

### Model Parameters
- **Evaluation**: `temperature: 0.2`, structured JSON output
- **Suggestions**: `temperature: 0.7`, more creative improvement ideas
- **Multi-provider fallback**: OpenAI primary → Google Gemini backup

### Cost Estimate (per evaluation)
- OpenAI GPT-4o-mini: ~$0.002-0.005 (short resume) to $0.01-0.02 (long resume)
- At 100 evals/day → ~$0.50-2.00/day → ~$15-60/month

---

## 3. 📄 Resume Parsing — Technical Recommendations

| Format | Library | Accuracy | Notes |
|--------|---------|----------|-------|
| PDF | `pdf-parse` (pdf.js) | Good for text PDFs | ~90% for digital, fails on scanned |
| PDF | `llama-parse` | Excellent | Cloud API, handles tables/columns |
| DOCX | `mammoth.js` | Very good | Converts to clean HTML/markdown |
| Scanned | OCR via Google Vision or Tesseract | Good with Vision, OK with Tesseract | Vision is cheaper than AWS Textract |

### ⚠️ Vercel Constraints
| Limit | Hobby | Pro |
|-------|-------|-----|
| Function timeout | 10s | 60s (300s on Enterprise) |
| Request body | 4.5MB | 4.5MB |
| Response size | 4.5MB | 4.5MB |

**Implication**: Parsing + LLM evaluation in one serverless function on free tier will timeout. Need async processing or size limits.

### Recommended Architecture
```
Upload → Firebase Storage (presigned URL) → 
  Option A: Serverless function (for small files, <2MB) synchronous
  Option B: Queue + polling (for large files) async
```

---

## 4. ⚖️ Bias & Fairness — MVP Recommendations

### Minimum Viable Fairness Features
1. **PII masking** — Strip name, email, address before sending to LLM
2. **Bias flagging prompt** — Instruct model to flag biased criteria
3. **Disclaimer** — Transparent "this is AI, not a human reviewer" messaging
4. **No auto-rejection** — AI scores are advisory, never final

### PII Stripping Regex Targets
```
- Name patterns (prefix + capitalized words)
- Email addresses
- Phone numbers
- URLs / LinkedIn profiles
- Physical addresses
- Age indicators (graduation years, "years of experience")
```

### Regulatory Context
- **NYC Local Law 144**: Requires bias audit for automated hiring tools. Our disclaimer + PII masking helps compliance.
- **EEOC**: Technical guidance on adverse impact. Document your scoring criteria.
- **GDPR**: Right to explanation. We need to show *why* each score was given.

---

## 5. 🎨 UX/UI — Component Architecture

### Score Display (shadcn/ui)
```
<Card>
  <ScoreGauge value={78} />           ← Circular gauge with color scale
  <CategoryBreakdown>
    <ProgressBar label="Experience" value={85} color="green" />
    <ProgressBar label="Skills" value={72} color="yellow" />
    <ProgressBar label="Format" value={90} color="green" />
  </CategoryBreakdown>
</Card>
```

### Feedback Display
```
<Accordion type="multiple">
  <AccordionItem value="strengths">
    <Badge variant="success">Strengths</Badge>
    {strengths.map(s => <FeedbackItem text={s} />)}
  </AccordionItem>
  <AccordionItem value="improvements">
    <Badge variant="warning">Improvements</Badge>
    {improvements.map(i => <FeedbackItem text={i} suggestion={i.fix} />)}
  </AccordionItem>
</Accordion>
```

### Upload Flow States
```
┌────────────────────────────────────────┐
│  Drag & Drop or Click to Upload        │
│  [Supported: PDF, DOCX, TXT — 5MB max] │
│                                        │
│  After upload:                         │
│    Processing... <Skeleton />          │
│    Error: unsupported format           │
│    Error: file too large               │
│    Success → Preview extracted text    │
│    → "Evaluate" button                 │
└────────────────────────────────────────┘
```

### Color Scale for Scores
- **0-40**: Red (critical gaps)
- **41-60**: Amber (needs work)
- **61-80**: Yellow-green (good)
- **81-100**: Green (excellent)

---

## 6. 🏗️ File Processing Architecture — Decision

### Vercel Deployment Constraints
```
                       ┌─────────────────────────┐
                       │    Client Browser        │
                       │  (upload file)           │
                       └──────────┬──────────────┘
                                  │ presigned URL
                                  ▼
                       ┌─────────────────────────┐
                       │  Firebase Storage        │
                       │  (raw file, TTL: 30d)    │
                       └──────────┬──────────────┘
                                  │ webhook / trigger
                                  ▼
                       ┌─────────────────────────┐
                       │  Serverless Function     │
                       │  (parse + extract text)  │
                       └──────────┬──────────────┘
                                  │ plain text
                                  ▼
                       ┌─────────────────────────┐
                       │  LLM API (OpenAI/Gemini) │
                       │  (evaluate + score)      │
                       └──────────┬──────────────┘
                                  │ JSON result
                                  ▼
                       ┌─────────────────────────┐
                       │  Firestore               │
                       │  (store evaluation)      │
                       └──────────┬──────────────┘
                                  │ realtime listener
                                  ▼
                       ┌─────────────────────────┐
                       │  Client displays result  │
                       └─────────────────────────┘
```

### Recommendation: Hybrid Sync/Async
| File Size | Strategy | Timeout viable? |
|-----------|----------|----------------|
| < 500KB (text PDF) | Sync serverless | Yes (~3-5s total) |
| 500KB-5MB | Async with polling | No (parse + LLM > 10s) |
| > 5MB | Reject | Policy limit |

### Storage & Cleanup
- Firebase Storage: Upload → evaluate → store result → delete raw resume after eval
- TTL: 30-day automatic deletion for stored resumes (Firebase lifecycle rule)
- Cost: Firebase Storage ~$0.026/GB/month → negligible for text documents

---

## 7. 🎯 Strategic Recommendations (Priority Order)

### Phase 1 — MVP (Week 1-2)
- [ ] File upload (drag & drop) → Firebase Storage
- [ ] PDF/DOCX text extraction (pdf-parse + mammoth.js)
- [ ] Single LLM evaluation call with structured JSON output (Zod validated)
- [ ] Results page: score gauge + category breakdown + feedback list
- [ ] PII stripping before LLM call

### Phase 2 — Core (Week 3-4)
- [ ] Job description comparison (optional target role input)
- [ ] ATS compatibility analysis
- [ ] Bias flagging in evaluation output
- [ ] Evaluation history dashboard
- [ ] Share/export results

### Phase 3 — Polished (Week 5+)
- [ ] Async processing queue for large files
- [ ] Multi-provider fallback (OpenAI + Gemini)
- [ ] Cover letter generation based on resume gaps
- [ ] Improvement tracking over time
- [ ] Admin analytics dashboard

---

## 8. 📊 Key Differentiators vs Competitors

| Feature | Competitors | Our Position |
|---------|------------|-------------|
| Score explanation | Opaque/"proprietary" | **Every score traced to specific resume content** |
| Bias detection | None | **Bias flagging + PII masking** |
| Free tier | Extremely limited | **Meaningful free tier** (X evaluations/month) |
| Actionable feedback | Generic tips | **Prioritized improvement roadmap** |
| Transparency | "Black box" | **Full rubric + confidence indicators** |
| Privacy | Varies | **Auto-delete, no training on your data** |

---

*This brief is a living document. Update as implementation reveals new insights.*
