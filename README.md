# TruthLens

TruthLens is a React + FastAPI fake-news research application.

## 1. Frontend

Open PowerShell in the project folder:

```powershell
npm install
npm run dev
```

The website runs at:

http://localhost:5173

## 2. Backend

Open another PowerShell window:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend:

http://127.0.0.1:8000

## 3. Train a real model

Put your own CSV inside `backend/datasets`.

Your CSV needs a text column and a label column.

Example:

```text
text,label
"article text here",1
"another article",0
```

Then:

```powershell
cd backend
python train.py --csv datasets/yourfile.csv --text-column text --label-column label --model BiLSTM --epochs 5
```

The application refuses to predict when the selected model has not been trained. It does not use predefined predictions or demo news.
