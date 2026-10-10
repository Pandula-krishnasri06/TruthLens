import { useEffect, useState } from "react";
import {
  Brain,
  FileText,
  BarChart3,
  Database,
  Search,
  ShieldCheck
} from "lucide-react";

type Result = {
  prediction: string;
  fake_probability: number;
  real_probability: number;
  confidence: number;
  model: string;
  processing_time_ms: number;
  important_words: string[];
};

type ModelInfo = {
  name: string;
  trained: boolean;
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    auc?: number | null;
  };
};

type DatasetInfo = {
  filename: string;
  rows: number;
  columns: number;
  column_names: string[];
  label_counts?: {
    [key: string]: number;
  };
  preview?: {
    [key: string]: any;
  }[];
};

const API = "https://truthlens-2pec.onrender.com/api";

const MODEL_NAMES = [
  "ANN",
  "CNN",
  "RNN",
  "LSTM",
  "GRU",
  "BiLSTM",
  "CNN-LSTM"
];

export default function App() {
  const [page, setPage] = useState("home");
  const [text, setText] = useState("");
  const [model, setModel] = useState("CNN");
  const [result, setResult] =
    useState<Result | null>(null);
  const [loading, setLoading] =
    useState(false);
  const [status, setStatus] =
    useState("Checking backend...");

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(() => setStatus("Backend connected"))
      .catch(() =>
        setStatus("Backend not running")
      );
  }, []);

  async function analyze() {
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `${API}/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            text,
            model
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Prediction failed"
        );
      }

      setResult(data);

    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Prediction failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">

      <aside className="sidebar">

        <div className="brand">
          <Brain size={28} />
          <span>TruthLens</span>
        </div>

        <div className="tag">
          Deep Learning News Intelligence
        </div>

        {[
          ["home", "Home", ShieldCheck],
          ["analyze", "Analyze News", Search],
          [
            "models",
            "Model Comparison",
            BarChart3
          ],
          [
            "datasets",
            "Dataset Management",
            Database
          ]
        ].map(
          ([id, label, Icon]) => (
            <button
              className={
                page === id
                  ? "nav active"
                  : "nav"
              }
              onClick={() =>
                setPage(id as string)
              }
              key={id as string}
            >
              <Icon size={18} />
              {label as string}
            </button>
          )
        )}

        <div className="status">
          {status}
        </div>

      </aside>

      <main className="main">

        {page === "home" && (
          <section className="hero">

            <div className="eyebrow">
              AI + NLP + DEEP LEARNING
            </div>

            <h1>TruthLens</h1>

            <h2>
              Intelligent Fake News Detection
            </h2>

            <p>
              Analyze your own news text
              using trained deep-learning
              models.
            </p>

            <button
              className="primary"
              onClick={() =>
                setPage("analyze")
              }
            >
              Analyze News
            </button>

            <div className="cards">

              <Card
                icon={<Brain />}
                title="Deep Learning"
                text="ANN, CNN, RNN, LSTM, GRU, BiLSTM and CNN-LSTM."
              />

              <Card
                icon={<FileText />}
                title="Real Input"
                text="Predictions are generated from submitted news text."
              />

              <Card
                icon={<BarChart3 />}
                title="Evaluation"
                text="Train and evaluate models using your dataset."
              />

            </div>

          </section>
        )}

        {page === "analyze" && (
          <Analyze
            text={text}
            setText={setText}
            model={model}
            setModel={setModel}
            result={result}
            loading={loading}
            analyze={analyze}
          />
        )}

        {page === "models" && (
          <Models />
        )}

        {page === "datasets" && (
          <Datasets />
        )}

      </main>

    </div>
  );
}


function Analyze({
  text,
  setText,
  model,
  setModel,
  result,
  loading,
  analyze
}: {
  text: string;
  setText: (x: string) => void;
  model: string;
  setModel: (x: string) => void;
  result: Result | null;
  loading: boolean;
  analyze: () => void;
}) {

  return (
    <section>

      <h1>Analyze News</h1>

      <p className="muted">
        Enter news text and select a
        trained model.
      </p>

      <div className="panel">

        <label>Model</label>

        <select
          value={model}
          onChange={e =>
            setModel(e.target.value)
          }
        >
          {MODEL_NAMES.map(x => (
            <option key={x}>
              {x}
            </option>
          ))}
        </select>

        <label>News text</label>

        <textarea
          value={text}
          onChange={e =>
            setText(e.target.value)
          }
          placeholder="Paste the news article here..."
        />

        <button
          className="primary"
          disabled={
            loading ||
            !text.trim()
          }
          onClick={analyze}
        >
          {loading
            ? "Analyzing..."
            : "Analyze News"}
        </button>

      </div>

      {result && (
        <div className="result">

          <div
            className={
              result.prediction === "FAKE"
                ? "badge fake"
                : "badge real"
            }
          >
            {result.prediction}
          </div>

          <h2>
            {result.confidence.toFixed(2)}%
            confidence
          </h2>

          <p>
            Model: <b>{result.model}</b>
            {" · "}
            {result.processing_time_ms} ms
          </p>

          <div className="meter">

            <div
              style={{
                width:
                  `${result.fake_probability}%`
              }}
            />

          </div>

          <div className="prob">

            <span>
              Fake{" "}
              {result.fake_probability.toFixed(
                2
              )}
              %
            </span>

            <span>
              Real{" "}
              {result.real_probability.toFixed(
                2
              )}
              %
            </span>

          </div>

          <p>
            Important words:{" "}
            {result.important_words.length
              ? result.important_words.join(
                  ", "
                )
              : "No extracted terms"}
          </p>

        </div>
      )}

    </section>
  );
}


function Models() {

  const [models, setModels] =
    useState<ModelInfo[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {

    try {

      const response =
        await fetch(
          `${API}/models`
        );

      const data =
        await response.json();

      setModels(data);

    } catch {

      alert(
        "Could not load model information."
      );

    } finally {

      setLoading(false);

    }
  }

  return (
    <section>

      <h1>
        Deep Learning Models
      </h1>

      <p className="muted">
        Metrics are loaded from the
        trained models on the backend.
      </p>

      {loading && (
        <p>Loading models...</p>
      )}

      <div className="modelgrid">

        {models.map(m => (

          <div
            className="card"
            key={m.name}
          >

            <h3>{m.name}</h3>

            {m.trained ? (

              <>
                <p className="trained">
                  ✓ Trained
                </p>

                {m.metrics && (

                  <div className="metrics">

                    <p>
                      Accuracy:{" "}
                      {formatMetric(
                        m.metrics.accuracy
                      )}
                    </p>

                    <p>
                      Precision:{" "}
                      {formatMetric(
                        m.metrics.precision
                      )}
                    </p>

                    <p>
                      Recall:{" "}
                      {formatMetric(
                        m.metrics.recall
                      )}
                    </p>

                    <p>
                      F1 Score:{" "}
                      {formatMetric(
                        m.metrics.f1
                      )}
                    </p>

                    <p>
                      AUC:{" "}
                      {formatMetric(
                        m.metrics.auc
                      )}
                    </p>

                  </div>

                )}

              </>

            ) : (

              <p>
                Not trained
              </p>

            )}

          </div>

        ))}

      </div>

    </section>
  );
}


function formatMetric(
  value?: number | null
) {

  if (
    value === undefined ||
    value === null
  ) {
    return "N/A";
  }

  return `${(
    value * 100
  ).toFixed(2)}%`;
}


function Datasets() {

  const [file, setFile] =
    useState<File | null>(null);

  const [model, setModel] =
    useState("CNN");

  const [epochs, setEpochs] =
    useState(5);

  const [uploading, setUploading] =
    useState(false);

  const [training, setTraining] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [datasetInfo, setDatasetInfo] =
    useState<DatasetInfo | null>(
      null
    );


  async function uploadDataset() {

    if (!file) {

      alert(
        "Please select a CSV file."
      );

      return;
    }

    setUploading(true);
    setMessage("");
    setDatasetInfo(null);

    try {

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          `${API}/dataset/upload`,
          {
            method: "POST",
            body: formData
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Upload failed"
        );

      }

      setDatasetInfo(data);

      setMessage(
        "Dataset uploaded successfully."
      );

    } catch (e) {

      alert(
        e instanceof Error
          ? e.message
          : "Upload failed"
      );

    } finally {

      setUploading(false);

    }
  }


  async function trainModel() {

    if (!file) {

      alert(
        "Upload/select a CSV file first."
      );

      return;
    }

    if (!datasetInfo) {

      alert(
        "Upload the dataset first."
      );

      return;
    }

    setTraining(true);

    setMessage(
      `Training ${model}... Please wait.`
    );

    try {

      const response =
        await fetch(
          `${API}/train`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              filename:
                file.name,
              model,
              epochs
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Training failed"
        );

      }

      setMessage(
        `${model} training completed successfully.`
      );

    } catch (e) {

      alert(
        e instanceof Error
          ? e.message
          : "Training failed"
      );

    } finally {

      setTraining(false);

    }
  }


  return (
    <section>

      <h1>
        Dataset Management
      </h1>

      <p className="muted">
        Upload a labeled CSV dataset
        and view its information before
        training a deep-learning model.
      </p>


      <div className="panel">

        <h3>
          Dataset Upload
        </h3>

        <p>
          CSV must contain:
          <b> text </b>
          and
          <b> label </b>
          columns.
        </p>

        <p>
          Labels:
          <b> REAL / FAKE </b>
          or
          <b> 1 / 0 </b>
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={e => {

            setFile(
              e.target.files?.[0] ||
              null
            );

            setDatasetInfo(null);
            setMessage("");

          }}
        />

        <button
          className="primary"
          onClick={uploadDataset}
          disabled={
            uploading ||
            !file
          }
        >
          {uploading
            ? "Uploading..."
            : "Upload Dataset"}
        </button>

        {message && (
          <p>{message}</p>
        )}

      </div>


      {datasetInfo && (

        <div className="panel">

          <h3>
            Dataset Information
          </h3>


          <div className="cards">

            <div className="card">

              <h3>
                Dataset
              </h3>

              <p>
                {datasetInfo.filename}
              </p>

            </div>


            <div className="card">

              <h3>
                Total Rows
              </h3>

              <p>
                {datasetInfo.rows}
              </p>

            </div>


            <div className="card">

              <h3>
                Total Columns
              </h3>

              <p>
                {datasetInfo.columns}
              </p>

            </div>

          </div>


          {datasetInfo.column_names && (

            <div>

              <h3>
                Columns
              </h3>

              <p>
                {datasetInfo.column_names.join(
                  ", "
                )}
              </p>

            </div>

          )}


          {datasetInfo.label_counts && (

            <div>

              <h3>
                Label Distribution
              </h3>

              <p>
                Fake:{" "}
                {
                  datasetInfo
                    .label_counts
                    .Fake ??
                  datasetInfo
                    .label_counts
                    .fake ??
                  datasetInfo
                    .label_counts["0"] ??
                  0
                }
              </p>

              <p>
                Real:{" "}
                {
                  datasetInfo
                    .label_counts
                    .Real ??
                  datasetInfo
                    .label_counts
                    .real ??
                  datasetInfo
                    .label_counts["1"] ??
                  0
                }
              </p>

            </div>

          )}


          {datasetInfo.preview && (

            <div>

              <h3>
                Dataset Preview
              </h3>

              <div className="table-container">

                <table>

                  <thead>

                    <tr>

                      {datasetInfo
                        .column_names
                        .map(
                          column => (
                            <th
                              key={column}
                            >
                              {column}
                            </th>
                          )
                        )}

                    </tr>

                  </thead>


                  <tbody>

                    {datasetInfo.preview.map(
                      (
                        row,
                        index
                      ) => (

                        <tr
                          key={index}
                        >

                          {datasetInfo
                            .column_names
                            .map(
                              column => (

                                <td
                                  key={
                                    column
                                  }
                                >
                                  {String(
                                    row[
                                      column
                                    ] ??
                                      ""
                                  ).slice(
                                    0,
                                    100
                                  )}
                                </td>

                              )
                            )}

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          )}

        </div>

      )}


      <div className="panel">

        <h3>
          Train Model
        </h3>

        <label>
          Model
        </label>

        <select
          value={model}
          onChange={e =>
            setModel(
              e.target.value
            )
          }
        >

          {MODEL_NAMES.map(x => (

            <option key={x}>
              {x}
            </option>

          ))}

        </select>


        <label>
          Epochs
        </label>

        <input
          type="number"
          min="1"
          max="50"
          value={epochs}
          onChange={e =>
            setEpochs(
              Number(
                e.target.value
              )
            )
          }
        />


        <button
          className="primary"
          onClick={trainModel}
          disabled={
            training ||
            !file ||
            !datasetInfo
          }
        >
          {training
            ? `Training ${model}...`
            : `Train ${model}`}
        </button>

      </div>

    </section>
  );
}


function Card({
  icon,
  title,
  text
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {

  return (

    <div className="card">

      <div className="icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

    </div>

  );
}