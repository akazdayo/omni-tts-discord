import os
from pydantic import BaseModel

BASE_PATH = "voices/"
voices = [x for x in os.listdir(BASE_PATH) if x.endswith(".wav")]

class Transcript(BaseModel):
    id: str
    transcript: str

def is_speaker_available(voice: str)->bool:
    return f"{voice}.wav" in voices

def get_transcript()->Transcript:
    items = []
    with open(f"{BASE_PATH}/transcript.jsonl", "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            items.append(Transcript.model_validate_json(line))

    return items

