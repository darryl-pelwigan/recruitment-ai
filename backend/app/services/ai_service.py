from __future__ import annotations
import os
import re

_STOPWORDS = {
    'the', 'and', 'for', 'with', 'that', 'this', 'have', 'from', 'they',
    'will', 'your', 'what', 'make', 'like', 'into', 'been', 'more', 'also',
    'some', 'you', 'are', 'our', 'their', 'team', 'work', 'role', 'must',
    'able', 'good', 'help', 'about', 'which', 'would', 'should', 'could',
    'when', 'here', 'well', 'time', 'year', 'need', 'using', 'other', 'both',
    'each', 'very', 'than', 'then', 'them', 'these', 'those', 'such', 'only',
}

_UPLOADS_ROOT = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
)


def extract_pdf_text(pdf_path: str) -> str:
    """Extract plain text from a PDF file. Returns empty string on failure."""
    try:
        import pypdf
        with open(pdf_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            return " ".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return ""


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r'\b[a-zA-Z][a-zA-Z0-9+#.]*\b', text.lower()))


def score_application(
    resume_url: str | None,
    cover_letter: str | None,
    skills_required: str | None,
    description: str | None,
    requirements: str | None,
) -> float:
    """Compute a 0–100 AI match score for an application against a job.

    Scoring breakdown:
      - Skills keyword match   : 50 pts
      - JD keyword match       : 30 pts
      - Cover letter quality   : 20 pts
    """
    # Build candidate token set from resume PDF + cover letter
    resume_text = ""
    if resume_url:
        rel = resume_url.removeprefix("/uploads/")
        full_path = os.path.join(_UPLOADS_ROOT, rel)
        if os.path.exists(full_path):
            resume_text = extract_pdf_text(full_path)

    candidate = _tokenize(resume_text + " " + (cover_letter or ""))

    # 1. Required skills match (up to 50 pts)
    req_skills = [s.strip().lower() for s in (skills_required or "").split(",") if s.strip()]
    if req_skills:
        matched = sum(1 for s in req_skills if s in candidate)
        skills_score = (matched / len(req_skills)) * 50
    else:
        skills_score = 25.0  # neutral when no skills are specified on the job

    # 2. Job description / requirements keyword match (up to 30 pts)
    jd_tokens = _tokenize((description or "") + " " + (requirements or "")) - _STOPWORDS
    meaningful = [t for t in jd_tokens if len(t) >= 4][:40]
    if meaningful:
        matched_kw = sum(1 for kw in meaningful if kw in candidate)
        kw_score = (matched_kw / len(meaningful)) * 30
    else:
        kw_score = 15.0  # neutral when JD has no parseable keywords

    # 3. Cover letter quality bonus (up to 20 pts)
    cl_len = len((cover_letter or "").strip())
    if cl_len >= 100:
        cl_score = 20.0
    elif cl_len >= 30:
        cl_score = 10.0
    else:
        cl_score = 0.0

    return round(min(skills_score + kw_score + cl_score, 100.0), 1)
