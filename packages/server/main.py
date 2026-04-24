import io
import os

from fastapi import FastAPI, HTTPException, Response
import soundfile as sf
import speaker
from pydantic import BaseModel
from omnivoice import OmniVoice
import torch


class GenerateParams(BaseModel):
    text: str
    speaker: str


def resolve_device() -> str:
    configured = os.getenv("OMNITTS_DEVICE", "auto").strip().lower()
    if configured == "auto":
        return "cuda:0" if torch.cuda.is_available() else "cpu"
    return configured


def resolve_dtype(device: str) -> torch.dtype:
    configured = os.getenv("OMNITTS_DTYPE", "auto").strip().lower()
    if configured == "auto":
        return torch.float16 if device.startswith("cuda") else torch.float32

    dtype_by_name = {
        "float16": torch.float16,
        "float32": torch.float32,
        "bfloat16": torch.bfloat16,
    }
    if configured not in dtype_by_name:
        raise ValueError(f"Unsupported OMNITTS_DTYPE: {configured}")
    return dtype_by_name[configured]


device = resolve_device()
dtype = resolve_dtype(device)

model = OmniVoice.from_pretrained(
    "k2-fsa/OmniVoice", device_map=device, dtype=dtype, load_asr=False
)

transcript = {item.id: item.transcript for item in speaker.get_transcript()}

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
        ref_text=transcript.get(params.speaker),
        language_id=262,
    )

    buf = io.BytesIO()
    sf.write(buf, audio[0], 24000, format="WAV")
    return Response(content=buf.getvalue(), media_type="audio/wav")


@app.get("/speaker_list", response_model=list[str])
def get_speaker_list():
    return list(transcript)
