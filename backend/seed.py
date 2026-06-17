"""
Seed the database with demo data.
Run from the backend directory with the venv activated:
    python seed.py

Existing rows are skipped (safe to re-run).
All seeded users share the password: Password123!
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.job import Job
from app.models.application import Application

PASSWORD = hash_password("Password123!")

APPLICANTS = [
    {"full_name": "Liam Torres",     "email": "liam.torres@mail.com"},
    {"full_name": "Ava Nguyen",      "email": "ava.nguyen@mail.com"},
    {"full_name": "Noah Patel",      "email": "noah.patel@mail.com"},
    {"full_name": "Sophia Kim",      "email": "sophia.kim@mail.com"},
    {"full_name": "Ethan Rivera",    "email": "ethan.rivera@mail.com"},
    {"full_name": "Isabella Chen",   "email": "isabella.chen@mail.com"},
    {"full_name": "Mason Clark",     "email": "mason.clark@mail.com"},
    {"full_name": "Mia Johnson",     "email": "mia.johnson@mail.com"},
    {"full_name": "James Anderson",  "email": "james.anderson@mail.com"},
    {"full_name": "Charlotte White", "email": "charlotte.white@mail.com"},
]

RECRUITERS = [
    {"full_name": "Olivia Bennett", "email": "olivia.bennett@recruitai.com"},
    {"full_name": "Henry Walsh",    "email": "henry.walsh@recruitai.com"},
    {"full_name": "Grace Murphy",   "email": "grace.murphy@recruitai.com"},
    {"full_name": "Daniel Park",    "email": "daniel.park@recruitai.com"},
    {"full_name": "Zoe Campbell",   "email": "zoe.campbell@recruitai.com"},
]

HR_USERS = [
    {"full_name": "Samuel Evans", "email": "samuel.evans@recruitai.com"},
    {"full_name": "Lily Foster",  "email": "lily.foster@recruitai.com"},
    {"full_name": "Owen Hughes",  "email": "owen.hughes@recruitai.com"},
    {"full_name": "Chloe Ross",   "email": "chloe.ross@recruitai.com"},
    {"full_name": "Caleb Reed",   "email": "caleb.reed@recruitai.com"},
]

JOBS = [
    {
        "title": "Senior Frontend Engineer",
        "description": "<p>We are looking for a <strong>Senior Frontend Engineer</strong> to join our product team and build delightful user experiences at scale. You will work closely with designers and backend engineers to ship features used by millions.</p>",
        "requirements": "5+ years of experience with React or Vue\nStrong TypeScript skills\nExperience with state management (Zustand, Redux)\nFamiliarity with CI/CD pipelines",
        "skills_required": "React, TypeScript, Tailwind CSS, Zustand, GraphQL",
        "location": "San Francisco, CA",
        "employment_type": "Full-time",
        "salary_min": 120000, "salary_max": 160000, "salary_currency": "USD",
        "company_name": "NovaTech Inc.",
        "contact_email": "hiring@novatech.io",
        "status": "open",
    },
    {
        "title": "Backend Engineer (Python)",
        "description": "<p>Join our platform team and build the APIs powering our next-generation products. You'll design scalable services, own reliability, and mentor junior engineers.</p>",
        "requirements": "4+ years with Python\nFastAPI or Django REST Framework\nPostgreSQL and Redis experience\nDocker / Kubernetes knowledge a plus",
        "skills_required": "Python, FastAPI, PostgreSQL, Redis, Docker",
        "location": "Remote",
        "employment_type": "Remote",
        "salary_min": 110000, "salary_max": 145000, "salary_currency": "USD",
        "company_name": "NovaTech Inc.",
        "contact_email": "hiring@novatech.io",
        "status": "open",
    },
    {
        "title": "Data Scientist",
        "description": "<p>We need a curious <strong>Data Scientist</strong> to turn raw data into actionable insights and build ML models that drive business decisions.</p>",
        "requirements": "MS or PhD in a quantitative field preferred\n3+ years hands-on ML experience\nProficient in Python (scikit-learn, pandas, PyTorch)\nExperience deploying models to production",
        "skills_required": "Python, PyTorch, scikit-learn, SQL, Airflow",
        "location": "New York, NY",
        "employment_type": "Full-time",
        "salary_min": 115000, "salary_max": 155000, "salary_currency": "USD",
        "company_name": "DataWave Analytics",
        "contact_email": "careers@datawave.ai",
        "status": "open",
    },
    {
        "title": "DevOps Engineer",
        "description": "<p>Own our cloud infrastructure and help engineering teams ship faster and safer. You'll manage Kubernetes clusters, CI/CD pipelines, and observability tooling.</p>",
        "requirements": "3+ years in a DevOps or SRE role\nKubernetes and Helm experience\nTerraform for infrastructure-as-code\nOn-call rotation expected",
        "skills_required": "Kubernetes, Terraform, AWS, GitHub Actions, Prometheus",
        "location": "Austin, TX",
        "employment_type": "Full-time",
        "salary_min": 105000, "salary_max": 140000, "salary_currency": "USD",
        "company_name": "CloudNine Systems",
        "contact_email": "jobs@cloudnine.dev",
        "status": "open",
    },
    {
        "title": "Product Designer (UX/UI)",
        "description": "<p>We are hiring a <strong>Product Designer</strong> who sweats the details and advocates for users at every step of the design process.</p>",
        "requirements": "3+ years of product design experience\nProficiency in Figma\nPortfolio demonstrating end-to-end design work\nExperience running user research sessions",
        "skills_required": "Figma, User Research, Prototyping, Design Systems",
        "location": "Remote",
        "employment_type": "Remote",
        "salary_min": 95000, "salary_max": 130000, "salary_currency": "USD",
        "company_name": "PixelForge Studio",
        "contact_email": "design@pixelforge.io",
        "status": "open",
    },
    {
        "title": "iOS Developer",
        "description": "<p>Build and maintain our iOS application used by 2M+ users. You'll collaborate with the design and backend teams to deliver a best-in-class mobile experience.</p>",
        "requirements": "3+ years Swift development\nExperience publishing to the App Store\nSwiftUI and UIKit knowledge\nFamiliarity with REST APIs and CoreData",
        "skills_required": "Swift, SwiftUI, Xcode, CoreData, REST APIs",
        "location": "Seattle, WA",
        "employment_type": "Full-time",
        "salary_min": 108000, "salary_max": 145000, "salary_currency": "USD",
        "company_name": "AppCraft Labs",
        "contact_email": "mobile@appcraft.com",
        "status": "open",
    },
    {
        "title": "Machine Learning Engineer",
        "description": "<p>Work at the intersection of research and production. You'll take ML experiments from notebooks to reliable, low-latency services at scale.</p>",
        "requirements": "Strong Python and ML fundamentals\nExperience with model serving (TorchServe, TFServing, or similar)\nMLOps tooling (MLflow, DVC, Weights & Biases)\nSolid understanding of data pipelines",
        "skills_required": "Python, PyTorch, MLflow, Kubernetes, SQL",
        "location": "Boston, MA",
        "employment_type": "Full-time",
        "salary_min": 130000, "salary_max": 175000, "salary_currency": "USD",
        "company_name": "DataWave Analytics",
        "contact_email": "careers@datawave.ai",
        "status": "open",
    },
    {
        "title": "Full Stack Developer (React + Node)",
        "description": "<p>We are a fast-moving startup looking for a versatile <strong>Full Stack Developer</strong> comfortable owning features from database to UI.</p>",
        "requirements": "React and Node.js proficiency\n2+ years professional experience\nExperience with PostgreSQL or MongoDB\nFamiliar with cloud deployments (AWS or GCP)",
        "skills_required": "React, Node.js, PostgreSQL, AWS, Docker",
        "location": "Remote",
        "employment_type": "Remote",
        "salary_min": 90000, "salary_max": 125000, "salary_currency": "USD",
        "company_name": "Launchpad Digital",
        "contact_email": "dev@launchpaddigital.co",
        "status": "open",
    },
    {
        "title": "Cybersecurity Analyst",
        "description": "<p>Protect our infrastructure and customer data. You'll monitor for threats, respond to incidents, and harden our security posture.</p>",
        "requirements": "2+ years in a security operations or analyst role\nSIEM tools experience (Splunk, Elastic)\nKnowledge of OWASP Top 10\nSecurity certifications (CompTIA, CISSP) a plus",
        "skills_required": "SIEM, Splunk, OWASP, Incident Response, Python",
        "location": "Washington, D.C.",
        "employment_type": "Full-time",
        "salary_min": 95000, "salary_max": 130000, "salary_currency": "USD",
        "company_name": "ShieldNet Security",
        "contact_email": "security@shieldnet.com",
        "status": "open",
    },
    {
        "title": "Technical Recruiter",
        "description": "<p>Help us grow our engineering teams by finding and attracting top technical talent. You'll partner with hiring managers, run interviews, and drive an exceptional candidate experience.</p>",
        "requirements": "2+ years technical recruiting experience\nFamiliarity with engineering roles and tech stacks\nExperience with ATS platforms\nExcellent communication skills",
        "skills_required": "Sourcing, ATS, LinkedIn Recruiter, Interviewing, Negotiation",
        "location": "Chicago, IL",
        "employment_type": "Full-time",
        "salary_min": 75000, "salary_max": 100000, "salary_currency": "USD",
        "company_name": "TalentBridge Group",
        "contact_email": "hr@talentbridge.com",
        "status": "open",
    },
    {
        "title": "Android Developer",
        "description": "<p>Join our mobile team to build and improve our Android app. You'll work in a collaborative environment with a strong focus on code quality and performance.</p>",
        "requirements": "3+ years Android development with Kotlin\nJetpack Compose experience preferred\nPublished apps on Google Play\nExperience with MVVM architecture",
        "skills_required": "Kotlin, Jetpack Compose, Android SDK, Firebase, REST APIs",
        "location": "Los Angeles, CA",
        "employment_type": "Full-time",
        "salary_min": 100000, "salary_max": 135000, "salary_currency": "USD",
        "company_name": "AppCraft Labs",
        "contact_email": "mobile@appcraft.com",
        "status": "open",
    },
    {
        "title": "Cloud Solutions Architect",
        "description": "<p>Design and implement cloud-native architectures for enterprise clients. You'll lead technical discovery workshops, define reference architectures, and guide engineering teams.</p>",
        "requirements": "7+ years in software or infrastructure engineering\nAWS or Azure certifications preferred\nExperience with large-scale distributed systems\nStrong communication and presentation skills",
        "skills_required": "AWS, Azure, Terraform, Microservices, Solutions Architecture",
        "location": "Dallas, TX",
        "employment_type": "Full-time",
        "salary_min": 145000, "salary_max": 195000, "salary_currency": "USD",
        "company_name": "CloudNine Systems",
        "contact_email": "jobs@cloudnine.dev",
        "status": "open",
    },
    {
        "title": "QA Automation Engineer",
        "description": "<p>Build and maintain our automated test suites to ensure high-quality releases. You'll work embedded in engineering squads and own testing strategy for key product areas.</p>",
        "requirements": "3+ years in QA automation\nProficiency with Selenium, Playwright, or Cypress\nExperience with Python or JavaScript test frameworks\nCI/CD pipeline integration experience",
        "skills_required": "Playwright, Python, Selenium, Jest, GitHub Actions",
        "location": "Remote",
        "employment_type": "Remote",
        "salary_min": 85000, "salary_max": 115000, "salary_currency": "USD",
        "company_name": "NovaTech Inc.",
        "contact_email": "hiring@novatech.io",
        "status": "open",
    },
    {
        "title": "Marketing Data Analyst",
        "description": "<p>Turn marketing metrics into growth strategies. You'll analyze campaign performance, build attribution models, and partner with the growth team to optimize spend.</p>",
        "requirements": "2+ years in marketing analytics or growth\nStrong SQL skills\nExperience with Google Analytics, Mixpanel, or similar\nAbility to present findings to non-technical stakeholders",
        "skills_required": "SQL, Python, Google Analytics, Looker, A/B Testing",
        "location": "New York, NY",
        "employment_type": "Full-time",
        "salary_min": 80000, "salary_max": 105000, "salary_currency": "USD",
        "company_name": "GrowthLab Co.",
        "contact_email": "analytics@growthlab.co",
        "status": "open",
    },
    {
        "title": "Site Reliability Engineer",
        "description": "<p>Keep our platform running at 99.99% uptime. You'll build automation, improve observability, and respond to incidents with a mindset of eliminating toil.</p>",
        "requirements": "4+ years SRE or backend engineering\nExperience defining and tracking SLOs/SLAs\nStrong scripting skills (Python, Bash)\nPrometheus, Grafana, or Datadog experience",
        "skills_required": "Prometheus, Grafana, Kubernetes, Python, Terraform",
        "location": "Remote",
        "employment_type": "Remote",
        "salary_min": 120000, "salary_max": 160000, "salary_currency": "USD",
        "company_name": "CloudNine Systems",
        "contact_email": "jobs@cloudnine.dev",
        "status": "open",
    },
    {
        "title": "Technical Writer",
        "description": "<p>Create clear, developer-friendly documentation for our APIs, SDKs, and platform features. You'll work closely with engineers and PMs to keep docs accurate and up to date.</p>",
        "requirements": "2+ years technical writing experience\nFamiliarity with REST APIs and developer tools\nExperience with docs-as-code workflows (Markdown, Git)\nStrong attention to detail",
        "skills_required": "Markdown, OpenAPI, Git, Docs-as-Code, REST APIs",
        "location": "Remote",
        "employment_type": "Part-time",
        "salary_min": 55000, "salary_max": 75000, "salary_currency": "USD",
        "company_name": "Launchpad Digital",
        "contact_email": "dev@launchpaddigital.co",
        "status": "open",
    },
    {
        "title": "Blockchain Developer",
        "description": "<p>Build smart contracts and decentralized applications on EVM-compatible chains. You'll work on DeFi protocols and help shape our Web3 product roadmap.</p>",
        "requirements": "2+ years Solidity development\nExperience with Hardhat or Foundry\nUnderstanding of DeFi primitives\nFamiliarity with auditing tools (Slither, MythX)",
        "skills_required": "Solidity, Hardhat, Ethereum, TypeScript, Web3.js",
        "location": "Miami, FL",
        "employment_type": "Contract",
        "salary_min": 100000, "salary_max": 150000, "salary_currency": "USD",
        "company_name": "ChainForge Labs",
        "contact_email": "dev@chainforge.xyz",
        "status": "open",
    },
    {
        "title": "HR Business Partner",
        "description": "<p>Partner with business leaders to align people strategies with company goals. You'll drive talent programs, manage employee relations, and lead organizational change.</p>",
        "requirements": "5+ years HR generalist or HRBP experience\nStrong knowledge of employment law\nExperience supporting engineering or technical teams a plus\nPHR or SHRM certification preferred",
        "skills_required": "Employee Relations, Talent Management, HRIS, Change Management",
        "location": "Denver, CO",
        "employment_type": "Full-time",
        "salary_min": 85000, "salary_max": 115000, "salary_currency": "USD",
        "company_name": "TalentBridge Group",
        "contact_email": "hr@talentbridge.com",
        "status": "open",
    },
    {
        "title": "Frontend Engineer (Vue.js)",
        "description": "<p>Build performant, accessible web interfaces with Vue 3 and TypeScript. You'll collaborate on a design system used across our product suite.</p>",
        "requirements": "3+ years Vue.js experience\nTypeScript proficiency\nFamiliar with Pinia or Vuex\nKnowledge of accessibility (WCAG) standards",
        "skills_required": "Vue 3, TypeScript, Pinia, Vite, CSS",
        "location": "Portland, OR",
        "employment_type": "Full-time",
        "salary_min": 95000, "salary_max": 130000, "salary_currency": "USD",
        "company_name": "PixelForge Studio",
        "contact_email": "design@pixelforge.io",
        "status": "open",
    },
    {
        "title": "Junior Software Engineer",
        "description": "<p>A great opportunity for a recent graduate or early-career engineer to grow fast in a supportive team. You'll work on real features, get code reviews, and level up quickly.</p>",
        "requirements": "0–2 years professional experience\nProficiency in at least one language (Python, JavaScript, or Java)\nEagerness to learn and receive feedback\nBasic understanding of Git and web fundamentals",
        "skills_required": "Python or JavaScript, Git, REST APIs, SQL",
        "location": "Atlanta, GA",
        "employment_type": "Full-time",
        "salary_min": 65000, "salary_max": 85000, "salary_currency": "USD",
        "company_name": "Launchpad Digital",
        "contact_email": "dev@launchpaddigital.co",
        "status": "open",
    },
]

# (applicant_index, [job_indices]) — each applicant applies to 3 jobs
APPLICATIONS = [
    (0, [0, 1,  7]),
    (1, [0, 2,  9]),
    (2, [1, 3,  6]),
    (3, [2, 4,  8]),
    (4, [0, 5, 10]),
    (5, [3, 6, 11]),
    (6, [4, 7, 12]),
    (7, [5, 8, 13]),
    (8, [6, 9, 14]),
    (9, [7, 10, 15]),
]

COVER_LETTERS = [
    "I am excited to apply for this role. My background aligns closely with what your team is looking for, and I am confident I can make an immediate impact.",
    "Having followed your company's work for some time, I believe this position is a perfect match for my skills and career goals.",
    "I bring a proven track record in this area and am eager to contribute to your team's continued growth and success.",
    None,
    "This opportunity excites me greatly. I have spent the past few years honing exactly the skills this role requires and I am ready for my next challenge.",
]


def get_or_create_user(db, full_name: str, email: str, role: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        print(f"  skip   {email}")
        return user
    user = User(full_name=full_name, email=email, password=PASSWORD, role=role)
    db.add(user)
    db.flush()
    print(f"  create {role:<10} {email}")
    return user


def main():
    db = SessionLocal()
    try:
        print("\n--- Users ---")
        applicant_users = [
            get_or_create_user(db, u["full_name"], u["email"], "applicant")
            for u in APPLICANTS
        ]
        recruiter_users = [
            get_or_create_user(db, u["full_name"], u["email"], "recruiter")
            for u in RECRUITERS
        ]
        hr_users = [
            get_or_create_user(db, u["full_name"], u["email"], "hr")
            for u in HR_USERS
        ]
        db.commit()

        all_managers = recruiter_users + hr_users  # 10 people, 20 jobs ->2 each

        print("\n--- Jobs ---")
        job_records: list[Job] = []
        for i, job_data in enumerate(JOBS):
            poster = all_managers[i % len(all_managers)]
            existing = (
                db.query(Job)
                .filter(
                    Job.title == job_data["title"],
                    Job.company_name == job_data["company_name"],
                    Job.deleted_at == None,  # noqa: E711
                )
                .first()
            )
            if existing:
                print(f"  skip   {job_data['title']}")
                job_records.append(existing)
                continue
            job = Job(**job_data, posted_by_id=poster.id)
            db.add(job)
            db.flush()
            job_records.append(job)
            print(f"  create {job_data['title']} ({poster.full_name})")
        db.commit()

        print("\n--- Applications ---")
        for applicant_idx, job_indices in APPLICATIONS:
            applicant = applicant_users[applicant_idx]
            for offset, job_idx in enumerate(job_indices):
                if job_idx >= len(job_records):
                    continue
                job = job_records[job_idx]
                exists = (
                    db.query(Application)
                    .filter(
                        Application.user_id == applicant.id,
                        Application.job_id == job.id,
                    )
                    .first()
                )
                if exists:
                    print(f"  skip   {applicant.full_name} ->{job.title}")
                    continue
                cover = COVER_LETTERS[(applicant_idx + offset) % len(COVER_LETTERS)]
                db.add(Application(
                    user_id=applicant.id,
                    job_id=job.id,
                    status="applied",
                    ai_score=0.0,
                    cover_letter=cover,
                ))
                print(f"  create {applicant.full_name} ->{job.title}")
        db.commit()

        print("\nSeed complete.\n")
        print("Password for all accounts : Password123!")
        print()
        print(f"{'Role':<12} {'Email'}")
        print("-" * 45)
        for u in APPLICANTS:
            print(f"  {'applicant':<10} {u['email']}")
        for u in RECRUITERS:
            print(f"  {'recruiter':<10} {u['email']}")
        for u in HR_USERS:
            print(f"  {'hr':<10} {u['email']}")

    except Exception as exc:
        db.rollback()
        print(f"\nSeed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
