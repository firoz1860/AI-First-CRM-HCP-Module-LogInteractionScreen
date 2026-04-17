"""Seed the database with sample HCPs, interactions, and next best actions."""
import sys
import os
import uuid
from datetime import date, timedelta, datetime
import random

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import SessionLocal, create_tables
from models.hcp import HCP
from models.interaction import Interaction
from models.next_best_action import NextBestAction

PRODUCTS = ["Jardiance", "Ozempic", "Trulicity", "Farxiga", "Victoza", "Metformin"]

HCP_DATA = [
    {"name": "Dr. Sarah Chen", "specialty": "Endocrinology", "institution": "Mount Sinai Medical Center", "email": "s.chen@mountsinai.org", "phone": "212-555-0101", "territory": "Northeast", "tier": "A", "preferred_contact": "in-person"},
    {"name": "Dr. Raj Patel", "specialty": "General Practice", "institution": "Community Health Clinic", "email": "r.patel@commhealth.org", "phone": "312-555-0102", "territory": "Midwest", "tier": "B", "preferred_contact": "phone"},
    {"name": "Dr. Emily Johnson", "specialty": "Cardiology", "institution": "Boston Heart Institute", "email": "e.johnson@bostonheart.org", "phone": "617-555-0103", "territory": "Northeast", "tier": "A", "preferred_contact": "email"},
    {"name": "Dr. Michael Kim", "specialty": "Endocrinology", "institution": "UCLA Medical Center", "email": "m.kim@uclahealth.org", "phone": "310-555-0104", "territory": "West", "tier": "A", "preferred_contact": "in-person"},
    {"name": "Dr. Lisa Rodriguez", "specialty": "Internal Medicine", "institution": "Houston Methodist", "email": "l.rodriguez@houstonmeth.org", "phone": "713-555-0105", "territory": "South", "tier": "B", "preferred_contact": "email"},
    {"name": "Dr. James Thompson", "specialty": "General Practice", "institution": "Chicago Family Medicine", "email": "j.thompson@chicagofam.org", "phone": "773-555-0106", "territory": "Midwest", "tier": "C", "preferred_contact": "phone"},
    {"name": "Dr. Priya Sharma", "specialty": "Endocrinology", "institution": "Johns Hopkins Hospital", "email": "p.sharma@jhopkins.edu", "phone": "410-555-0107", "territory": "Northeast", "tier": "A", "preferred_contact": "in-person"},
    {"name": "Dr. David Wilson", "specialty": "Cardiology", "institution": "Cleveland Clinic", "email": "d.wilson@clevelandclinic.org", "phone": "216-555-0108", "territory": "Midwest", "tier": "B", "preferred_contact": "email"},
    {"name": "Dr. Amy Park", "specialty": "Internal Medicine", "institution": "Stanford Medical Center", "email": "a.park@stanfordmed.org", "phone": "650-555-0109", "territory": "West", "tier": "B", "preferred_contact": "phone"},
    {"name": "Dr. Carlos Mendez", "specialty": "General Practice", "institution": "Miami Primary Care", "email": "c.mendez@miamiprimary.org", "phone": "305-555-0110", "territory": "South", "tier": "C", "preferred_contact": "email"},
]

INTERACTION_TYPES = ["detail_visit", "lunch_meeting", "conference", "phone_call", "virtual_meeting", "sample_drop"]
COMPLIANCE_STATUSES = ["compliant", "compliant", "compliant", "compliant", "flagged", "pending"]

SUMMARIES = [
    "Productive detail visit discussing Jardiance cardiovascular outcomes. HCP showed strong interest in EMPEROR-Reduced trial data. Follow-up scheduled to provide clinical reprints.",
    "Lunch meeting focused on Ozempic weight management indications. Dr. expressed interest in trying on newly diagnosed T2D patients. Discussed dosing protocols and patient support programs.",
    "Phone call to follow up on previous samples. HCP reported positive patient feedback on Jardiance tolerability. Discussed expanding use to additional patients.",
    "Virtual meeting covering Trulicity once-weekly dosing convenience. HCP concerned about injection site reactions. Provided patient education materials.",
    "Sample drop visit with Farxiga. Left 4 samples. Brief discussion on DAPA-HF trial outcomes. Follow-up detail visit scheduled.",
    "Conference presentation attendance. Engaged with HCP during poster session on GLP-1 receptor agonists. Strong interest in Victoza for adolescent patients.",
]


def seed():
    create_tables()
    db = SessionLocal()

    try:
        # Check if already seeded
        existing = db.query(HCP).count()
        if existing > 0:
            print(f"Database already has {existing} HCPs. Skipping seed.")
            return

        print("Seeding HCPs...")
        hcp_ids = []
        for hcp_data in HCP_DATA:
            hcp = HCP(id=str(uuid.uuid4()), **hcp_data)
            db.add(hcp)
            hcp_ids.append(hcp.id)

        db.flush()

        print("Seeding interactions...")
        interaction_ids = []
        for i in range(25):
            hcp_id = random.choice(hcp_ids)
            products = random.sample(PRODUCTS, random.randint(1, 3))
            samples = [{"product": p, "quantity": random.randint(1, 4)} for p in random.sample(products, min(2, len(products)))]
            days_ago = random.randint(1, 90)

            interaction = Interaction(
                id=str(uuid.uuid4()),
                hcp_id=hcp_id,
                rep_id="rep_001",
                interaction_date=date.today() - timedelta(days=days_ago),
                interaction_type=random.choice(INTERACTION_TYPES),
                products_discussed=products,
                samples_provided=samples,
                key_messages_delivered=f"Discussed {', '.join(products)} clinical outcomes and patient benefits.",
                hcp_feedback="HCP showed interest and asked for additional data.",
                follow_up_required=random.choice([True, False, False]),
                follow_up_date=(date.today() + timedelta(days=random.randint(7, 30))) if random.random() > 0.6 else None,
                ai_summary=random.choice(SUMMARIES),
                ai_entities={"products": products, "conditions": ["Type 2 Diabetes", "Cardiovascular Disease"]},
                compliance_status=random.choice(COMPLIANCE_STATUSES),
                compliance_notes="Standard compliance review completed.",
            )
            db.add(interaction)
            interaction_ids.append((interaction.id, hcp_id))

        db.flush()

        print("Seeding next best actions...")
        for interaction_id, hcp_id in random.sample(interaction_ids, 5):
            action = NextBestAction(
                id=str(uuid.uuid4()),
                hcp_id=hcp_id,
                interaction_id=interaction_id,
                action_type=random.choice(["follow_up_visit", "send_literature", "schedule_meeting", "virtual_detail"]),
                action_description="Schedule follow-up to present updated clinical outcomes data and discuss patient case studies.",
                priority=random.choice(["high", "medium", "low"]),
                due_date=date.today() + timedelta(days=random.randint(7, 30)),
                status="pending",
                rationale="HCP showed strong interest in efficacy data during last interaction.",
            )
            db.add(action)

        db.commit()
        print(f"[OK] Seeded {len(HCP_DATA)} HCPs, 25 interactions, 5 next best actions")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
