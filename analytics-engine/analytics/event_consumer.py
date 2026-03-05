"""
Clario Analytics Engine — Redis Streams Event Consumer
Listens for QuestionAttempt and DuelResult events from the Node.js backend,
processes them through the ML pipeline in near real-time.
"""

import json
import time
import traceback
import redis
from .config import config
from .db import db
from .bkt_engine import BKTEngine
from .trueskill_rating import process_duel_result


STREAM_KEY = "clario:events"
GROUP_NAME = "analytics-engine"
CONSUMER_NAME = "worker-1"


class EventConsumer:
    """Consumes events from Redis Streams and routes to ML processors."""

    def __init__(self):
        self.redis = redis.from_url(config.REDIS_URL, decode_responses=True)
        self.bkt = BKTEngine()
        self._ensure_consumer_group()

    def _ensure_consumer_group(self):
        """Create the consumer group if it doesn't exist."""
        try:
            self.redis.xgroup_create(STREAM_KEY, GROUP_NAME, id="0", mkstream=True)
            print(f"[Consumer] Created consumer group '{GROUP_NAME}'")
        except redis.exceptions.ResponseError as e:
            if "BUSYGROUP" in str(e):
                pass  # Group already exists
            else:
                raise

    def run(self):
        """Main event loop — blocks and processes events as they arrive."""
        print(f"[Consumer] Listening on stream '{STREAM_KEY}' as '{CONSUMER_NAME}'...")
        db.initialize()

        while True:
            try:
                # Read new messages (block for 5 seconds if no messages)
                messages = self.redis.xreadgroup(
                    GROUP_NAME, CONSUMER_NAME,
                    {STREAM_KEY: ">"},
                    count=10,
                    block=5000,
                )

                if not messages:
                    continue

                for stream, entries in messages:
                    for msg_id, data in entries:
                        self._process_event(msg_id, data)

            except KeyboardInterrupt:
                print("[Consumer] Shutting down...")
                break
            except Exception as e:
                print(f"[Consumer] Error: {e}")
                traceback.print_exc()
                time.sleep(1)

    def _process_event(self, msg_id, data):
        """Route an event to the appropriate processor."""
        event_type = data.get("type", "unknown")

        try:
            if event_type == "question_attempt":
                payload = json.loads(data.get("payload", "{}"))
                self._handle_question_attempt(payload)

            elif event_type == "duel_result":
                payload = json.loads(data.get("payload", "{}"))
                self._handle_duel_result(payload)

            else:
                print(f"[Consumer] Unknown event type: {event_type}")

            # Acknowledge the message
            self.redis.xack(STREAM_KEY, GROUP_NAME, msg_id)

        except Exception as e:
            print(f"[Consumer] Failed to process {msg_id}: {e}")
            traceback.print_exc()

    def _handle_question_attempt(self, payload):
        """Process a single question attempt through BKT."""
        user_id = payload.get("user_id")
        subject = payload.get("subject")
        topic = payload.get("topic")
        is_correct = payload.get("is_correct", False)
        time_taken_ms = payload.get("time_taken_ms", 0)

        if not all([user_id, subject, topic]):
            return

        # Update BKT mastery for this concept
        new_mastery = self.bkt.update(
            user_id=user_id,
            subject=subject,
            topic=topic,
            subtopic=payload.get("subtopic"),
            concept_tag=payload.get("concept_tag"),
            is_correct=is_correct,
            time_taken_ms=time_taken_ms,
        )

        print(f"[BKT] {user_id[:8]}… {subject}/{topic} "
              f"{'✓' if is_correct else '✗'} → mastery={new_mastery:.4f}")

    def _handle_duel_result(self, payload):
        """Process a duel result through TrueSkill."""
        winner_id = payload.get("winner_id")
        loser_id = payload.get("loser_id")
        is_draw = payload.get("is_draw", False)
        duel_id = payload.get("duel_id")

        if not winner_id or not loser_id:
            return

        result = process_duel_result(
            winner_id=winner_id,
            loser_id=loser_id,
            duel_id=duel_id,
            is_draw=is_draw,
        )
        print(f"[TrueSkill] Duel {duel_id or 'N/A'} processed: {result}")


def start_consumer():
    """Entry point for the consumer worker."""
    consumer = EventConsumer()
    consumer.run()


if __name__ == "__main__":
    start_consumer()
