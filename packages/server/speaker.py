from pathlib import Path
from pydantic import BaseModel

BASE_PATH = Path(__file__).resolve().parents[2] / "voices"
voices = [path.name for path in BASE_PATH.iterdir() if path.suffix == ".wav"]


class Transcript(BaseModel):
    id: str
    transcript: str


def is_speaker_available(voice: str) -> bool:
    return f"{voice}.wav" in voices


def get_transcript() -> list[Transcript]:
    items = []
    with (BASE_PATH / "transcript.jsonl").open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            items.append(Transcript.model_validate_json(line))

    return items
