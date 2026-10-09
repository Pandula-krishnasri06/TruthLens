import os
import json
import argparse
import pandas as pd
import tensorflow as tf

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

MODELS = ["ANN", "CNN", "RNN", "LSTM", "GRU", "BiLSTM", "CNN-LSTM"]


def normalize_label(x):
    s = str(x).strip().lower()

    if s in {"fake", "0", "false"}:
        return 0

    if s in {"real", "1", "true"}:
        return 1

    raise ValueError(f"Unsupported label: {x}")


def build_model(name, vocab, max_len, emb=64):

    inp = tf.keras.Input(shape=(max_len,))

    x = tf.keras.layers.Embedding(
        input_dim=vocab,
        output_dim=emb
    )(inp)

    if name == "ANN":
        x = tf.keras.layers.GlobalAveragePooling1D()(x)
        x = tf.keras.layers.Dense(128, activation="relu")(x)

    elif name == "CNN":
        x = tf.keras.layers.Conv1D(
            128,
            5,
            activation="relu"
        )(x)

        x = tf.keras.layers.GlobalMaxPooling1D()(x)

    elif name == "RNN":
        x = tf.keras.layers.SimpleRNN(96)(x)

    elif name == "LSTM":
        x = tf.keras.layers.LSTM(96)(x)

    elif name == "GRU":
        x = tf.keras.layers.GRU(96)(x)

    elif name == "BiLSTM":
        x = tf.keras.layers.Bidirectional(
            tf.keras.layers.LSTM(96)
        )(x)

    elif name == "CNN-LSTM":
        x = tf.keras.layers.Conv1D(
            96,
            5,
            activation="relu"
        )(x)

        x = tf.keras.layers.MaxPooling1D(2)(x)

        x = tf.keras.layers.LSTM(64)(x)

    x = tf.keras.layers.Dropout(0.3)(x)

    out = tf.keras.layers.Dense(
        1,
        activation="sigmoid"
    )(x)

    model = tf.keras.Model(inp, out)

    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )

    return model


def train_one_model(
    name,
    X_train,
    X_test,
    y_train,
    y_test,
    vocab,
    max_len,
    tokenizer,
    epochs
):

    print()
    print("=" * 50)
    print("TRAINING:", name)
    print("=" * 50)

    model = build_model(
        name,
        vocab,
        max_len
    )

    model.fit(
        X_train,
        y_train,
        validation_split=0.1,
        epochs=epochs,
        batch_size=32,
        verbose=1
    )

    p = model.predict(
        X_test,
        verbose=0
    ).ravel()

    pred = (p >= 0.5).astype(int)

    metrics = {
        "accuracy": float(
            accuracy_score(
                y_test,
                pred
            )
        ),
        "precision": float(
            precision_score(
                y_test,
                pred,
                zero_division=0
            )
        ),
        "recall": float(
            recall_score(
                y_test,
                pred,
                zero_division=0
            )
        ),
        "f1": float(
            f1_score(
                y_test,
                pred,
                zero_division=0
            )
        ),
        "auc": float(
            roc_auc_score(
                y_test,
                p
            )
        ) if len(set(y_test)) == 2 else None
    }

    os.makedirs(
        "saved_models",
        exist_ok=True
    )

    model.save(
        f"saved_models/{name}.keras"
    )

    with open(
        f"saved_models/{name}.json",
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            {
                "max_len": max_len,
                "tokenizer": tokenizer.to_json(),
                "metrics": metrics
            },
            f,
            indent=2
        )

    print()
    print(name, "TRAINING COMPLETE")
    print(json.dumps(metrics, indent=2))


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--csv",
        required=True
    )

    parser.add_argument(
        "--text-column",
        default="text"
    )

    parser.add_argument(
        "--label-column",
        default="label"
    )

    parser.add_argument(
        "--model",
        default="BiLSTM"
    )

    parser.add_argument(
        "--epochs",
        type=int,
        default=15
    )

    args = parser.parse_args()

    if args.model != "ALL" and args.model not in MODELS:
        raise ValueError(
            "Unsupported model"
        )

    df = pd.read_csv(
        args.csv
    )

    df = df.dropna(
        subset=[
            args.text_column,
            args.label_column
        ]
    )

    texts = df[
        args.text_column
    ].astype(str).tolist()

    y = df[
        args.label_column
    ].map(normalize_label).astype("int32").values

    if len(set(y)) < 2:
        raise ValueError(
            "Dataset must contain both REAL and FAKE labels"
        )

    tokenizer = tf.keras.preprocessing.text.Tokenizer(
        num_words=20000,
        oov_token="<OOV>"
    )

    tokenizer.fit_on_texts(
        texts
    )

    max_len = min(
        400,
        max(
            50,
            max(
                len(x.split())
                for x in texts
            )
        )
    )

    X = tf.keras.preprocessing.sequence.pad_sequences(
        tokenizer.texts_to_sequences(texts),
        maxlen=max_len
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    vocab = min(
        20000,
        len(tokenizer.word_index) + 1
    )

    if args.model == "ALL":

        for name in MODELS:

            train_one_model(
                name,
                X_train,
                X_test,
                y_train,
                y_test,
                vocab,
                max_len,
                tokenizer,
                args.epochs
            )

    else:

        train_one_model(
            args.model,
            X_train,
            X_test,
            y_train,
            y_test,
            vocab,
            max_len,
            tokenizer,
            args.epochs
        )


if __name__ == "__main__":
    main()