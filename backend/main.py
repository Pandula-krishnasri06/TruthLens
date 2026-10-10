
import os
import json
import re
import time
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import tokenizer_from_json

app = FastAPI(title="TruthLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = "saved_models"
loaded_models = {}

class PredictRequest(BaseModel):
    text: str
    model: str = "BiLSTM"

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/predict")
def predict(req: PredictRequest):
    name = req.model
    model_path = os.path.join(MODEL_DIR, f"{name}.keras")
    info_path = os.path.join(MODEL_DIR, f"{name}.json")

    if not os.path.exists(model_path) or not os.path.exists(info_path):
        raise HTTPException(
            status_code=404,
            detail=f"Model {name} is not available on the server."
        )

    try:
        if name not in loaded_models:
            loaded_models[name] = tf.keras.models.load_model(model_path)

        with open(info_path, "r", encoding="utf-8") as f:
            info = json.load(f)

        tokenizer = tokenizer_from_json(info["tokenizer"])
        max_len = int(info["max_len"])

        start = time.time()
        sequences = tokenizer.texts_to_sequences([req.text])
        padded = pad_sequences(
            sequences, maxlen=max_len, padding="post", truncating="post"
        )
        output = float(loaded_models[name].predict(padded, verbose=0).reshape(-1)[0])

        fake_prob = (1 - output) * 100
        real_prob = output * 100
        prediction = "REAL" if output >= 0.5 else "FAKE"
        confidence = max(fake_prob, real_prob)

        words = re.findall(r"[A-Za-z]{3,}", req.text.lower())
        important_words = list(dict.fromkeys(words))[:10]

        return {
            "prediction": prediction,
            "fake_probability": round(fake_prob, 2),
            "real_probability": round(real_prob, 2),
            "confidence": round(confidence, 2),
            "model": name,
            "processing_time_ms": round((time.time() - start) * 1000, 2),
            "important_words": important_words
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
