export async function getSpeakers(): Promise<string[]> {
  const res = await fetch("http://localhost:8000/speaker_list");

  if (!res.ok || !res.body) {
    throw new Error(`generate failed: ${res.status} ${res.statusText}`);
  }

  const data: string[] = await res.json();
  return data;
}

