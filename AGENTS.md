# Repository Guidelines

## Project Structure & Module Organization

This repository combines a Discord bot, a FastAPI voice service, and a Gleam message queue library.

- `packages/bot/`: TypeScript Discord bot. Commands live in `commands/`, reusable helpers in `lib/`, and the entry point is `index.ts`.
- `packages/server/`: Python FastAPI service. `main.py` exposes the API and `speaker.py` handles speaker metadata.
- `packages/message_queue/`: Gleam package compiled to JavaScript for bot queue state transitions. Tests are in `test/`.
- `voices/`: local voice assets and transcript data.
- Root files such as `flake.nix`, `vite.config.ts`, `package.json`, and `pyproject.toml` define tooling.

## Build, Test, and Development Commands

Use `nix develop` for consistent Bun, Node, uv, Gleam, and formatter versions.

Common commands:

- `bun install`: install TypeScript dependencies.
- `bun fmt`: check formatting through `vite-plus`.
- `bun fmt:fix`: apply TypeScript/JSON formatting.
- `bun lint`: run lint checks with warnings denied.
- `bun lint:type-aware`: run stricter type-aware linting.
- `nix fmt`: run repository formatting via treefmt, including Gleam, Nix, Python, and TypeScript.
- `cd packages/message_queue && gleam test`: run Gleam queue tests.
- `uv run fastapi dev packages/server/main.py`: run the local FastAPI service.
- `bun packages/bot/index.ts`: run the Discord bot entry point.

## Coding Style & Naming Conventions

Follow formatter output rather than hand-formatting. TypeScript uses ESM imports, explicit file extensions for local imports, two-space indentation, and kebab-case filenames such as `get-speakers.ts`. Python is formatted by `ruff-format`; use typed Pydantic models for API payloads. Gleam functions and tests use snake_case, with tests ending in `_test`.

## Testing Guidelines

Automated tests currently cover `packages/message_queue` with Gleeunit. Add queue behavior tests in `packages/message_queue/test/*_test.gleam` whenever state transitions change. For bot or server changes, include focused manual verification until dedicated tests exist. Run `nix fmt`, `bun lint`, and relevant Gleam tests before submitting.

## Commit & Pull Request Guidelines

Git history uses short Conventional Commit prefixes, often in Japanese, for example `feat: ...`, `fix: ...`, `chore: ...`, and `hotfix: ...`. Keep commits scoped to one behavior change.

Pull requests should include a concise description, linked issue if applicable, commands run, and screenshots or logs when Discord behavior or API responses change. Mention required environment variables such as `DISCORD_TOKEN` or local voice asset setup.

## Security & Configuration Tips

Do not commit secrets, bot tokens, model caches, or generated voice assets. Treat `voices/` as local data unless a small example file is explicitly intended for version control.
