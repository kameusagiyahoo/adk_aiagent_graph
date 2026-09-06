# Runtime Bridge

Local-only bridge for Agent Graph Designer.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Windows:

```powershell
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Ollama default URL: `http://127.0.0.1:11434`.
The bridge accepts only loopback Ollama URLs for Local Execution.
