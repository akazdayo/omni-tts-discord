from fastapi import FastAPI, HTTPException, Response
import io
import soundfile as sf
import speaker
from pydantic import BaseModel
from omnivoice import OmniVoice
import torch


class GenerateParams(BaseModel):
    text: str
    speaker: str


model = OmniVoice.from_pretrained(
    "k2-fsa/OmniVoice", device_map="cuda:0", dtype=torch.float16
)

transcript = speaker.get_transcript()

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


@app.post("/generate")
def generateVoice(params: GenerateParams):
    if not speaker.is_speaker_available(params.speaker):
        raise HTTPException(404, "Selected speaker is not found")
    audio = model.generate(
        text=params.text,
        ref_audio=f"{speaker.BASE_PATH}/{params.speaker}.wav",
        ref_text=transcript[params.speaker] if params.speaker in transcript else None,
        language_id=262,
    )

    buf = io.BytesIO()
    sf.write(buf, audio[0], 24000, format="WAV")
    return Response(content=buf.getvalue(), media_type="audio/wav")


@app.get("/speaker_list", response_model=list[str])
def get_speaker_list():
    ids: list[str] = [x.id for x in transcript]
    return ids
