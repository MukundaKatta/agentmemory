# agentmemory live demo (Streamlit)

A small Streamlit app that demonstrates the three central design properties of [agentmemory](https://github.com/MukundaKatta/agentmemory):

1. **Pull, never push.** You must click "Retrieve + summarize" before any past memory enters the prompt.
2. **Show the trace.** Every summary displays the event ids and the exact prompt sent to Claude.
3. **Real deletes.** Each event has a delete button. Click it and the row is gone, no tombstone.

The app uses a Python sibling implementation (`agentmemory_py.py`) so it can deploy on standard Streamlit hosts without a Node runtime. The canonical library is the npm package, this is a thin reference port.

## Run locally

```bash
cd examples/streamlit
pip install -r requirements.txt
streamlit run app.py
```

Provide your `ANTHROPIC_API_KEY` in the sidebar (or as an env var). Leave it blank to run in dry-run mode (no Claude calls; the summarizer returns a stub so reviewers can poke around without spending tokens).

## Deploy on Streamlit Community Cloud (free)

1. Sign in at [share.streamlit.io](https://share.streamlit.io) with your GitHub account
2. Click **New app** → pick `MukundaKatta/agentmemory` → branch `main`
3. **Main file path:** `examples/streamlit/app.py`
4. Click **Deploy**
5. Once live, set `ANTHROPIC_API_KEY` in **Settings → Secrets** so the app can call Claude

The app will get a public URL like `https://agentmemory.streamlit.app` you can use as the live demo URL on hackathon submissions.

## Deploy on HuggingFace Spaces (free)

1. Create a new Space at [huggingface.co/new-space](https://huggingface.co/new-space)
2. **SDK:** Streamlit
3. Connect this repo or copy `app.py`, `agentmemory_py.py`, and `requirements.txt` into the Space's files
4. Add `ANTHROPIC_API_KEY` under **Settings → Variables and secrets**
5. The Space gets a public URL like `https://huggingface.co/spaces/<you>/agentmemory`

## What this demonstrates that a local script does not

- **A reviewer can poke memory without writing code.** They append events, watch retrieval scores, see the exact prompt sent to Claude, and delete events one by one.
- **Real deletes are visible.** Click delete, the row disappears from the UI immediately. No "soft deleted" flag, no archive folder.
- **The drift watcher is live.** As the user retrieves with drifting intents, the watcher's status flips from green to red.
- **Dry-run mode means anyone can try it.** No API key needed for the basic flow, so you can ship the URL even before getting your hackathon Claude credits.
