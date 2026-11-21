export interface MLProject {
  title: string;
  summary: string;
  stack: string[];
  url: string;
  repoName?: string;
}

// Priority ML/AI projects surfaced on /ml and used as the fallback on /projects
// when the GitHub API is unavailable. Order is intentional — CompuCal first.
// TODO: Replace the `url` values with the real repo/detail URLs once confirmed.
export const ML_PROJECTS: MLProject[] = [
  {
    title: "9th ABC Challenge — XR Head-Pose TCNN (Interactive 3D)",
    summary:
      "Joint Gold (1st place) at the 9th ABC Challenge with team Motion Pending (MTU), with the fewest parameters of any team. 7,555-parameter mirror-equivariant separable dilated TCN (k8_combined / LeanTCNN) for 200 ms 6DoF VR head-pose forecasting on BOXRR-23. Achieves 4.2501° validation / 4.2666° test geodesic error in 47–55 µs single-thread ONNX CPU latency. Includes an interactive Three.js 3D architecture & live inference visualizer.",
    stack: ["PyTorch", "ONNX Runtime", "Three.js", "SO(3) Quaternions", "Equivariant TCN", "TypeScript"],
    url: "/ml/abc-challenge",
    repoName: "abc-challenge",
  },
  {
    title: "CompuCal ML Platform",
    summary:
      "Production ML features shipped inside CompuCal's regulated calibration-management platform. RAG over internal documentation, OCR pipelines for scanned certificates, predictive-maintenance models, and MCP servers giving AI agents real database access.",
    stack: ["Python", "FastAPI", "pgvector", "LangChain", "Azure Document Intelligence", "MCP", "CatBoost"],
    url: "https://github.com/JacobDrizzle",
    repoName: "compucal-ml-platform",
  },
  {
    title: "ReviveMap",
    summary:
      "3rd place at the Google Hackathon. A map-based platform that helps communities identify and revive neglected public spaces, with AI-assisted categorisation of user-submitted reports.",
    stack: ["Next.js", "TypeScript", "Google Maps API", "Gemini", "Firebase"],
    url: "https://github.com/JacobDrizzle",
    repoName: "revivemap",
  },
  {
    title: "FinBERT + XGBoost Stock Prediction",
    summary:
      "Combines FinBERT sentiment extraction from financial news with gradient-boosted price-movement models. Benchmarked against a naive baseline with walk-forward validation rather than random splits.",
    stack: ["Python", "PyTorch", "Transformers", "XGBoost", "pandas", "scikit-learn"],
    url: "https://github.com/JacobDrizzle",
    repoName: "finbert-xgboost-stock",
  },
  {
    title: "NeuroMind System",
    summary:
      "Multi-agent orchestration built on CrewAI. Agents coordinate research, planning, and execution steps with tool access to external APIs rather than isolated prompt chains.",
    stack: ["Python", "CrewAI", "LangChain", "OpenAI", "FastAPI"],
    url: "https://github.com/JacobDrizzle",
    repoName: "neuromind",
  },
];

// Topic tags that mark a GitHub repo as ML/AI, safety or security work for the /projects sort.
export const ML_TOPIC_TAGS = [
  "ai-safety",
  "alignment",
  "evals",
  "security",
  "cybersecurity",
  "machine-learning",
  "ml",
  "ai",
  "rag",
  "llm",
  "llms",
  "nlp",
  "deep-learning",
  "agent",
  "agents",
  "mlops",
  "vector-database",
  "embeddings",
];

// Repo-name allow-list (lowercase). Matches partial — e.g. "finbert" matches
// "finbert-xgboost-stock". Used as a fallback when topic tags are missing.
export const ML_REPO_NAME_ALLOWLIST = [
  "abc-challenge",
  "compucal",
  "revivemap",
  "finbert",
  "neuromind",
  "rag",
  "agent",
  "crewai",
  "xgboost",
  "catboost",
  "ocr",
];

export function isMLRepo(repo: { name: string; topics?: string[] }): boolean {
  const topics = (repo.topics ?? []).map((t) => t.toLowerCase());
  if (topics.some((t) => ML_TOPIC_TAGS.includes(t))) return true;
  const name = repo.name.toLowerCase();
  return ML_REPO_NAME_ALLOWLIST.some((needle) => name.includes(needle));
}
