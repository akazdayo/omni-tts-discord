from functools import lru_cache
from pathlib import Path
from typing import TypeAlias

import numpy as np
import soundfile as sf
import torch
import torchaudio
from pydantic import BaseModel

BASE_PATH = Path(__file__).resolve().parents[2] / "voices"
AVERAGE_SPEAKER_ID = "average"
AudioSource: TypeAlias = str | tuple[np.ndarray, int]


class Transcript(BaseModel):
    id: str
    transcript: str


@lru_cache(maxsize=1)
def _voice_paths() -> tuple[Path, ...]:
    if not BASE_PATH.exists():
        return ()
    return tuple(sorted(path for path in BASE_PATH.iterdir() if path.suffix == ".wav"))


@lru_cache(maxsize=1)
def get_transcript() -> list[Transcript]:
    transcript_path = BASE_PATH / "transcript.jsonl"
    if not transcript_path.exists():
        return []

    items = []
    with transcript_path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            items.append(Transcript.model_validate_json(line))

    return items


@lru_cache(maxsize=1)
def get_transcript_map() -> dict[str, str]:
    return {item.id: item.transcript for item in get_transcript()}


@lru_cache(maxsize=1)
def get_available_speaker_ids() -> tuple[str, ...]:
    transcript_ids = get_transcript_map()
    return tuple(
        path.stem for path in _voice_paths() if path.stem in transcript_ids
    )


def get_speaker_list() -> list[str]:
    speakers = list(get_available_speaker_ids())
    if speakers:
        return [AVERAGE_SPEAKER_ID, *speakers]
    return []


def is_speaker_available(voice: str) -> bool:
    return voice == AVERAGE_SPEAKER_ID or voice in get_available_speaker_ids()


def _load_audio(path: Path, target_sample_rate: int | None = None) -> tuple[np.ndarray, int]:
    audio, sample_rate = sf.read(path, always_2d=True, dtype="float32")
    waveform = audio.mean(axis=1).astype(np.float32, copy=False)

    if target_sample_rate is not None and sample_rate != target_sample_rate:
        waveform_tensor = torch.from_numpy(waveform).unsqueeze(0)
        waveform = torchaudio.functional.resample(
            waveform_tensor, orig_freq=sample_rate, new_freq=target_sample_rate
        ).squeeze(0).cpu().numpy()
        sample_rate = target_sample_rate

    return waveform, sample_rate


@lru_cache(maxsize=1)
def get_average_transcript() -> str:
    transcript_map = get_transcript_map()
    return "\n\n".join(transcript_map[speaker_id] for speaker_id in get_available_speaker_ids())


@lru_cache(maxsize=8)
def build_average_reference_audio(target_sample_rate: int) -> tuple[np.ndarray, int]:
    available_speaker_ids = set(get_available_speaker_ids())
    waveforms = []
    for path in _voice_paths():
        if path.stem not in available_speaker_ids:
            continue

        waveform, sample_rate = _load_audio(path, target_sample_rate)
        if sample_rate != target_sample_rate:
            raise RuntimeError("Failed to resample reference audio to the target sample rate")
        if waveform.size:
            waveforms.append(waveform)

    if not waveforms:
        raise ValueError("No voice samples are available for averaging")

    min_length = min(waveform.shape[0] for waveform in waveforms)
    stacked = np.stack([waveform[:min_length] for waveform in waveforms], axis=0)
    averaged = stacked.mean(axis=0).astype(np.float32, copy=False)

    peak = float(np.max(np.abs(averaged)))
    if peak > 0:
        averaged = (averaged / peak * 0.95).astype(np.float32, copy=False)

    return averaged, target_sample_rate


def get_reference_inputs(voice: str, target_sample_rate: int) -> tuple[AudioSource, str]:
    if voice == AVERAGE_SPEAKER_ID:
        return build_average_reference_audio(target_sample_rate), get_average_transcript()

    transcript_map = get_transcript_map()
    if not is_speaker_available(voice) or voice not in transcript_map:
        raise KeyError(f"Speaker not found: {voice}")

    return f"{BASE_PATH}/{voice}.wav", transcript_map[voice]
