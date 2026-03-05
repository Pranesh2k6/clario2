"""
Clario Synthetic Data Simulator — Event Generator
Generates realistic question attempt events for all archetypes.
Populates attempt_history and runs the analytics pipeline.
"""

import uuid
import random
import sys
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, ".")

from analytics.db import db
from analytics.config import config
from .archetypes import ARCHETYPES, JEE_TAXONOMY


# ─── Difficulty settings ───────────────────────────────────────────────────────

DIFFICULTIES = ["Easy", "Medium", "Hard"]
DIFFICULTY_ACCURACY_MODIFIER = {
    "Easy": 0.15,    # Easier questions boost accuracy
    "Medium": 0.0,   # Baseline
    "Hard": -0.20,   # Harder questions reduce accuracy
}
DIFFICULTY_TIME_MODIFIER = {
    "Easy": -2000,
    "Medium": 0,
    "Hard": 3000,
}


def generate_synthetic_data(
    num_days=30,
    attempts_per_student_per_day=15,
    duels_per_student_per_day=2,
):
    """
    Generate synthetic question attempt events and populate the database.

    Args:
        num_days: Number of days of historical data to generate
        attempts_per_student_per_day: Avg attempts per student per day
        duels_per_student_per_day: Avg duels per student per day
    """
    print("=" * 60)
    print("  Clario Synthetic Data Simulator")
    print("=" * 60)

    db.initialize()

    try:
        # Generate students
        students = _generate_students()
        print(f"\n[SIM] Generated {len(students)} synthetic students")

        # Generate question attempts
        total_events = 0
        start_date = datetime.utcnow() - timedelta(days=num_days)

        for day_offset in range(num_days):
            current_date = start_date + timedelta(days=day_offset)

            for student in students:
                archetype = ARCHETYPES[student["archetype"]]
                day_improvement = 0.0

                if "improvement_rate" in archetype:
                    day_improvement = archetype["improvement_rate"] * day_offset

                # Practice attempts
                num_attempts = random.randint(
                    max(1, attempts_per_student_per_day - 5),
                    attempts_per_student_per_day + 5,
                )
                events = _generate_practice_events(
                    student, archetype, num_attempts, current_date, day_improvement
                )
                _insert_events(events)
                total_events += len(events)

                # Duel attempts
                num_duels = random.randint(0, duels_per_student_per_day)
                for _ in range(num_duels):
                    opponent = random.choice([s for s in students if s["id"] != student["id"]])
                    duel_events = _generate_duel_events(
                        student, opponent, archetype, current_date, day_improvement
                    )
                    _insert_events(duel_events)
                    total_events += len(duel_events)

            if (day_offset + 1) % 5 == 0:
                print(f"  → Day {day_offset + 1}/{num_days} complete ({total_events} events so far)")

        print(f"\n[SIM] Total events generated: {total_events}")
        print(f"[SIM] Students: {len(students)}")
        print(f"[SIM] Days simulated: {num_days}")
        print("=" * 60)

    finally:
        db.close()


def _generate_students():
    """Create synthetic student records and return their IDs + archetypes."""
    students = []

    for archetype_key, archetype in ARCHETYPES.items():
        for i in range(archetype["count"]):
            student_id = str(uuid.uuid4())
            students.append({
                "id": student_id,
                "archetype": archetype_key,
                "name": f"{archetype['name']} #{i+1}",
            })

    return students


def _generate_practice_events(student, archetype, num_attempts, base_date, improvement):
    """Generate practice question attempt events."""
    events = []

    for i in range(num_attempts):
        # Pick a random topic from the JEE taxonomy
        subject = random.choice(list(JEE_TAXONOMY.keys()))
        topic = random.choice(list(JEE_TAXONOMY[subject].keys()))
        topic_data = JEE_TAXONOMY[subject][topic]
        subtopic = random.choice(topic_data["subtopics"])
        concept_tag = random.choice(topic_data["concept_tags"])
        difficulty = random.choice(DIFFICULTIES)

        # Calculate accuracy based on archetype + topic weakness + difficulty
        base_acc = archetype["base_accuracy"] + improvement
        if subtopic in archetype.get("weak_topics", []):
            base_acc -= 0.25  # Significant penalty for weak topics
        base_acc += DIFFICULTY_ACCURACY_MODIFIER[difficulty]
        base_acc = max(0.05, min(0.98, base_acc))  # Clamp

        # Add variance
        acc = base_acc + random.gauss(0, archetype["accuracy_variance"])
        acc = max(0.0, min(1.0, acc))
        is_correct = random.random() < acc

        # Calculate time
        base_time = archetype["base_time_ms"] + DIFFICULTY_TIME_MODIFIER[difficulty]
        time_taken = max(1000, int(base_time + random.gauss(0, archetype["time_variance_ms"])))

        # Timestamp with some randomness within the day
        hours_offset = random.uniform(8, 22)  # Between 8am and 10pm
        timestamp = base_date.replace(hour=0, minute=0, second=0) + timedelta(hours=hours_offset)

        events.append({
            "id": str(uuid.uuid4()),
            "user_id": student["id"],
            "question_id": str(uuid.uuid4()),  # Synthetic question ID
            "is_correct": is_correct,
            "selected_answer_index": random.randint(0, 3),
            "time_taken_ms": time_taken,
            "difficulty_at_time": {"Easy": 0.3, "Medium": 0.6, "Hard": 0.9}[difficulty],
            "context": "practice",
            "duel_id": None,
            "subject": subject,
            "topic": topic,
            "subtopic": subtopic,
            "concept_tag": concept_tag,
            "attempt_number": 1,
            "power_card_used": None,
            "duel_result": None,
            "created_at": timestamp,
        })

    return events


def _generate_duel_events(student, opponent, archetype, base_date, improvement):
    """Generate a full duel (10 question attempts) with result."""
    duel_id = str(uuid.uuid4())
    events = []
    student_score = 0
    opponent_score = 0

    # Pick a subject+topic for this duel
    subject = random.choice(list(JEE_TAXONOMY.keys()))
    topic = random.choice(list(JEE_TAXONOMY[subject].keys()))
    topic_data = JEE_TAXONOMY[subject][topic]

    for q_index in range(10):
        subtopic = random.choice(topic_data["subtopics"])
        concept_tag = random.choice(topic_data["concept_tags"])
        difficulty = random.choice(DIFFICULTIES)
        question_id = str(uuid.uuid4())

        # Player attempt
        base_acc = archetype["base_accuracy"] + improvement
        if subtopic in archetype.get("weak_topics", []):
            base_acc -= 0.25
        base_acc += DIFFICULTY_ACCURACY_MODIFIER[difficulty]
        base_acc -= 0.05  # Slight duel stress penalty
        base_acc = max(0.05, min(0.98, base_acc))

        is_correct = random.random() < base_acc
        if is_correct:
            student_score += 100

        # Determine if opponent got it right (simplified)
        opp_archetype_key = opponent.get("archetype", "average")
        opp_archetype = ARCHETYPES.get(opp_archetype_key, ARCHETYPES["average"])
        opp_correct = random.random() < opp_archetype["base_accuracy"]
        if opp_correct:
            opponent_score += 100

        base_time = archetype["base_time_ms"] + DIFFICULTY_TIME_MODIFIER[difficulty]
        time_taken = max(1000, int(base_time + random.gauss(0, archetype["time_variance_ms"])))

        hours_offset = random.uniform(8, 22)
        timestamp = base_date.replace(hour=0, minute=0, second=0) + timedelta(hours=hours_offset)

        power_card = random.choice([None, None, None, "double_points", "time_freeze", "fifty_fifty"])

        events.append({
            "id": str(uuid.uuid4()),
            "user_id": student["id"],
            "question_id": question_id,
            "is_correct": is_correct,
            "selected_answer_index": random.randint(0, 3),
            "time_taken_ms": time_taken,
            "difficulty_at_time": {"Easy": 0.3, "Medium": 0.6, "Hard": 0.9}[difficulty],
            "context": "duel",
            "duel_id": duel_id,
            "subject": subject,
            "topic": topic,
            "subtopic": subtopic,
            "concept_tag": concept_tag,
            "attempt_number": 1,
            "power_card_used": power_card,
            "duel_result": None,  # Set below after all questions
            "created_at": timestamp,
        })

    # Determine duel result
    duel_result = "win" if student_score > opponent_score else ("loss" if student_score < opponent_score else "draw")
    for event in events:
        event["duel_result"] = duel_result

    return events


def _insert_events(events):
    """Bulk-insert events into the attempt_history table."""
    if not events:
        return

    query = """
        INSERT INTO attempt_history
            (id, user_id, question_id, is_correct, selected_answer_index,
             time_taken_ms, difficulty_at_time, context, duel_id,
             subject, topic, subtopic, concept_tag, attempt_number,
             power_card_used, duel_result, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            for e in events:
                cur.execute(query, (
                    e["id"],
                    e["user_id"],
                    e["question_id"],
                    e["is_correct"],
                    e["selected_answer_index"],
                    e["time_taken_ms"],
                    e["difficulty_at_time"],
                    e["context"],
                    e["duel_id"],
                    e["subject"],
                    e["topic"],
                    e["subtopic"],
                    e["concept_tag"],
                    e["attempt_number"],
                    e["power_card_used"],
                    e["duel_result"],
                    e["created_at"],
                ))


if __name__ == "__main__":
    # Allow CLI args for days and attempts
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    attempts = int(sys.argv[2]) if len(sys.argv) > 2 else 15
    generate_synthetic_data(num_days=days, attempts_per_student_per_day=attempts)
