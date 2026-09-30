"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Target,
  Database,
  FileText,
  CheckCircle2,
  Layers3,
  Globe2,
  MapPin,
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Trash2,
  X,
  Upload,
  FileUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

type RiskLevel = "Critical" | "High" | "Medium" | "Low";

type Metric = {
  id: string | number;
  objectiveId?: string | number | null;
  name: string;
  kind: string;
  unit: string;
  baseline: number;
  target: number;
  currentValue: number;
  expectedValue?: number | null;
  weight: number;
  progress: number;
  evidenceRequired: boolean;
  lastUpdated?: string | null;
};

type Objective = {
  id: string | number;
  title: string;
  description: string;
  weight: number;
  metrics: Metric[];
};

type Project = {
  id: string;
  name: string;
  sector: string;
  state: string;
  location: string;
  approvedCost: number;
  currentExpenditure: number;
  progress: number;
  expected: number;
  risk: number;
  riskLevel: RiskLevel;
  costRisk: RiskLevel;
  delayRisk: RiskLevel;
  status: string;
  projectType: string;
  description: string;
  startDate?: string | null;
  targetDate?: string | null;
  progressModel: string;
  measurementConfidence?: number | null;
  objectives: Objective[];
  metrics: Metric[];
};

type AlertItem = {
  id: string;
  projectId: string;
  projectName: string;
  category: string;
  level: RiskLevel;
  title: string;
  text: string;
  status: string;
};

type EvidenceItem = {
  id: string | number;
  projectId: string;
  metricId?: string | number | null;
  metricName?: string | null;
  evidenceType: string;
  sourceName: string;
  reference: string;
  extractedValue?: number | null;
  confidence: number;
  notes: string;
  createdAt?: string | null;
  observedAt?: string | null;
  appliedAt?: string | null;
  isCurrent?: boolean;
};

type EvidenceCandidate = {
  value: number;
  confidence: number;
  context: string;
  reason?: string;
};

type EvidenceRecommendation = {
  metricId: string | number;
  metricName: string;
  unit: string;
  metricKind: string;
  recommendedValue: number;
  confidence: number;
  extractionConfidence: number;
  sourceConfidence: number;
  context: string;
  reasonCodes: string[];
  explanation: string;
  consistencyAverage?: number | null;
  consistencyDeviationPercent?: number | null;
  selectionNote?: string;
};

type EvidenceConsistencyInsight = {
  metricId: string | number;
  metricName: string;
  unit: string;
  status: "consistent" | "watch" | "conflict";
  message: string;
  sourceCount: number;
  minimum: number;
  maximum: number;
  average: number;
  spreadPercent: number;
  currentValue: number;
  sources: { evidenceId: string | number; sourceName: string; reference: string; value: number; confidence: number; createdAt?: string | null }[];
};



type IntelligenceSignal = {
  id: string;
  code: string;
  level: RiskLevel;
  title: string;
  message: string;
  metricId?: string | number | null;
  value?: number | null;
  threshold?: number | null;
  recommendedAction?: string;
};

type MetricHistoryPoint = {
  evidenceId: string;
  observedAt: string;
  value: number;
  confidence: number;
  sourceName: string;
  reference: string;
  isCurrent: boolean;
};

type MetricHistory = {
  metricId: string | number;
  metricName: string;
  unit: string;
  baseline: number;
  target: number;
  currentValue: number;
  progress: number;
  trend: string;
  observationCount: number;
  observations: MetricHistoryPoint[];
  latestObservedAt?: string | null;
  previousValue?: number | null;
  delta?: number | null;
  deltaPercent?: number | null;
  daysBetween?: number | null;
  ratePerDay?: number | null;
  overallRatePerDay?: number | null;
  requiredRatePerDay?: number | null;
  targetRemaining: number;
  daysToTarget?: number | null;
  paceRatio?: number | null;
  paceStatus: string;
};

type ProjectIntelligence = {
  attentionLevel: RiskLevel;
  summary: string;
  overallProgress: number;
  expectedProgress: number;
  progressGap: number;
  riskScore: number;
  measurementConfidence?: number | null;
  evidenceConflicts: number;
  signalCount: number;
  signals: IntelligenceSignal[];
  drivers: { code: string; level: RiskLevel; title: string; message: string; metricId?: string | number | null }[];
  recommendedActions: string[];
  explainability?: {
    method: string;
    inputs: string[];
    dataChanged: boolean;
  };
};

type CreateMetricForm = {
  name: string;
  kind: string;
  unit: string;
  baseline: string;
  target: string;
  current_value: string;
  expected_value: string;
  weight: string;
  evidence_required: boolean;
};

type CreateObjectiveForm = {
  title: string;
  description: string;
  weight: string;
  metrics: CreateMetricForm[];
};

type CreateEvidenceDraft = {
  file: File | null;
  sourceName: string;
  reference: string;
  metricKey: string;
  evidenceType: string;
  observedAt: string;
  confidence: string;
  notes: string;
};

type CreateProjectForm = {
  name: string;
  project_type: string;
  description: string;
  sector: string;
  state: string;
  location: string;
  start_date: string;
  target_date: string;
  approved_cost: string;
  current_expenditure: string;
  expected_progress: string;
  status: string;
  objectives: CreateObjectiveForm[];
  evidence: CreateEvidenceDraft[];
};

const PROJECT_TYPE_OPTIONS = [
  ["Infrastructure", "Construction, physical assets and capital works"],
  ["Healthcare", "Facilities, services and public health delivery"],
  ["Education", "Schools, learners and education services"],
  ["Welfare", "Benefits, social programmes and beneficiary reach"],
  ["Digital", "Platforms, modules and digital adoption"],
  ["Environment", "Restoration, conservation and ecological targets"],
  ["Agriculture", "Farmers, land, irrigation and agricultural delivery"],
  ["Housing", "Housing delivery, completion and occupancy"],
  ["Water", "Water connections, sanitation and coverage"],
  ["Energy", "Generation, capacity and connections"],
  ["Transport", "Rail, metro, transit and mobility"],
  ["Administrative", "Government services and process delivery"],
  ["Other", "Custom public-sector programme"],
] as const;

const METRIC_PRESETS: Record<string, { objective: string; name: string; kind: string; unit: string; weight: number }[]> = {
  Infrastructure: [
    { objective: "Physical delivery", name: "Quantity completed", kind: "quantity", unit: "units", weight: 60 },
    { objective: "Physical delivery", name: "Milestones completed", kind: "milestone", unit: "milestones", weight: 40 },
  ],
  Healthcare: [
    { objective: "Service delivery", name: "Facilities/services delivered", kind: "count", unit: "units", weight: 50 },
    { objective: "Coverage", name: "People reached", kind: "beneficiaries", unit: "people", weight: 50 },
  ],
  Education: [
    { objective: "Delivery", name: "Schools/services delivered", kind: "count", unit: "units", weight: 50 },
    { objective: "Reach", name: "Students covered", kind: "beneficiaries", unit: "students", weight: 50 },
  ],
  Welfare: [
    { objective: "Reach", name: "Beneficiaries reached", kind: "beneficiaries", unit: "people", weight: 70 },
    { objective: "Delivery", name: "Programme milestones completed", kind: "milestone", unit: "milestones", weight: 30 },
  ],
  Digital: [
    { objective: "Deployment", name: "Modules/services deployed", kind: "count", unit: "modules", weight: 50 },
    { objective: "Adoption", name: "Users onboarded", kind: "beneficiaries", unit: "users", weight: 50 },
  ],
  Environment: [
    { objective: "Restoration", name: "Area restored", kind: "area", unit: "hectares", weight: 60 },
    { objective: "Outcome", name: "Environmental targets completed", kind: "percentage", unit: "%", weight: 40 },
  ],
  Agriculture: [
    { objective: "Coverage", name: "Farmers covered", kind: "beneficiaries", unit: "farmers", weight: 50 },
    { objective: "Land coverage", name: "Area covered", kind: "area", unit: "hectares", weight: 50 },
  ],
  Housing: [
    { objective: "Delivery", name: "Houses completed", kind: "count", unit: "houses", weight: 70 },
    { objective: "Occupancy", name: "Houses occupied", kind: "count", unit: "houses", weight: 30 },
  ],
  Water: [
    { objective: "Coverage", name: "Households connected", kind: "count", unit: "households", weight: 60 },
    { objective: "Reach", name: "People covered", kind: "beneficiaries", unit: "people", weight: 40 },
  ],
  Energy: [
    { objective: "Capacity", name: "Capacity installed", kind: "capacity", unit: "MW", weight: 60 },
    { objective: "Reach", name: "Connections delivered", kind: "count", unit: "connections", weight: 40 },
  ],
  Transport: [
    { objective: "Delivery", name: "Transport assets/km delivered", kind: "quantity", unit: "units", weight: 60 },
    { objective: "Milestones", name: "Milestones completed", kind: "milestone", unit: "milestones", weight: 40 },
  ],
  Administrative: [
    { objective: "Service delivery", name: "Services/processes delivered", kind: "count", unit: "services", weight: 60 },
    { objective: "Adoption", name: "Users/cases served", kind: "beneficiaries", unit: "users", weight: 40 },
  ],
  Other: [
    { objective: "Primary objective", name: "Primary target completed", kind: "percentage", unit: "%", weight: 100 },
  ],
};

function blankMetric(
  preset?: Omit<Partial<CreateMetricForm>, "weight"> & { weight?: string | number }
): CreateMetricForm {
  return {
    name: preset?.name ?? "",
    kind: preset?.kind ?? "quantity",
    unit: preset?.unit ?? "units",
    baseline: String(preset?.baseline ?? "0"),
    target: String(preset?.target ?? ""),
    current_value: String(preset?.current_value ?? "0"),
    expected_value: String(preset?.expected_value ?? ""),
    weight: String(preset?.weight ?? "100"),
    evidence_required: preset?.evidence_required ?? false,
  };
}

function buildObjectivesForType(projectType: string): CreateObjectiveForm[] {
  const presets = METRIC_PRESETS[projectType] ?? METRIC_PRESETS.Other;

  // Start every project with ONE objective form.
  // Project-type presets are used to populate metrics inside that objective
  // instead of automatically creating multiple objective cards.
  return [
    {
      title: "Primary objective",
      description: "",
      weight: "100",
      metrics: presets.map((metric) => blankMetric(metric)),
    },
  ];
}

function emptyCreateForm(): CreateProjectForm {
  return {
    name: "",
    project_type: "Infrastructure",
    description: "",
    sector: "",
    state: "",
    location: "",
    start_date: "",
    target_date: "",
    approved_cost: "",
    current_expenditure: "",
    expected_progress: "0",
    status: "In Progress",
    objectives: buildObjectivesForType("Infrastructure"),
    evidence: [],
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

function evidenceHref(reference: string): string {
  const value = reference.trim();
  if (!value) return "";
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return value;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toId(value: unknown, fallback = ""): string | number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "Critical";
  if (score >= 65) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function formatCr(value: number): string {
  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(value)} Cr`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function riskLabel(score: number): string {
  if (score >= 65) return "HIGH";
  if (score >= 45) return "MODERATE";
  return "LOW";
}

function normalizeProject(project: any): Project {
  const risk = toNumber(project.risk_score);
  const objectives: Objective[] = Array.isArray(project.objectives)
    ? project.objectives.map((objective: any) => ({
        id: toId(objective.id, "objective"),
        title: String(objective.title ?? "Objective"),
        description: String(objective.description ?? ""),
        weight: toNumber(objective.weight),
        metrics: Array.isArray(objective.metrics)
          ? objective.metrics.map((metric: any) => ({
              id: toId(metric.id, "metric"),
              objectiveId: metric.objective_id ?? metric.objectiveId ?? null,
              name: String(metric.name ?? "Metric"),
              kind: String(metric.kind ?? "quantity"),
              unit: String(metric.unit ?? ""),
              baseline: toNumber(metric.baseline),
              target: toNumber(metric.target),
              currentValue: toNumber(metric.current_value),
              expectedValue: metric.expected_value == null ? null : toNumber(metric.expected_value),
              weight: toNumber(metric.weight),
              progress: Math.max(0, Math.min(100, toNumber(metric.progress))),
              evidenceRequired: Boolean(metric.evidence_required),
              lastUpdated: metric.last_updated ?? null,
            }))
          : [],
      }))
    : [];

  const metrics: Metric[] = Array.isArray(project.metrics)
    ? project.metrics.map((metric: any) => ({
        id: toId(metric.id, "metric"),
        objectiveId: metric.objective_id ?? metric.objectiveId ?? null,
        name: String(metric.name ?? "Metric"),
        kind: String(metric.kind ?? "quantity"),
        unit: String(metric.unit ?? ""),
        baseline: toNumber(metric.baseline),
        target: toNumber(metric.target),
        currentValue: toNumber(metric.current_value),
        expectedValue: metric.expected_value == null ? null : toNumber(metric.expected_value),
        weight: toNumber(metric.weight),
        progress: Math.max(0, Math.min(100, toNumber(metric.progress))),
        evidenceRequired: Boolean(metric.evidence_required),
        lastUpdated: metric.last_updated ?? null,
      }))
    : objectives.flatMap((objective) => objective.metrics);

  return {
    id: String(project.id ?? "UNKNOWN"),
    name: String(project.name ?? "Unnamed project"),
    sector: String(project.sector ?? "Unknown"),
    state: String(project.state ?? "Unknown"),
    location: String(project.location ?? project.state ?? "Unknown"),
    approvedCost: toNumber(project.approved_cost),
    currentExpenditure: toNumber(project.current_expenditure),
    progress: Math.max(0, Math.min(100, toNumber(project.overall_progress ?? project.physical_progress))),
    expected: Math.max(0, Math.min(100, toNumber(project.expected_overall_progress ?? project.expected_progress))),
    risk,
    riskLevel: getRiskLevel(risk),
    costRisk: getRiskLevelFromBackend(project.cost_risk, risk),
    delayRisk: getRiskLevelFromBackend(project.delay_risk, risk),
    status: String(project.status ?? "Monitoring"),
    projectType: String(project.project_type ?? "Infrastructure"),
    description: String(project.description ?? ""),
    startDate: project.start_date ?? null,
    targetDate: project.target_date ?? null,
    progressModel: String(project.progress_model ?? "legacy"),
    measurementConfidence: project.measurement_confidence == null ? null : toNumber(project.measurement_confidence),
    objectives,
    metrics,
  };
}
function getRiskLevelFromBackend(value: unknown, fallbackScore: number): RiskLevel {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "critical") return "Critical";
  if (normalized === "high") return "High";
  if (normalized === "medium" || normalized === "moderate") return "Medium";
  if (normalized === "low") return "Low";
  return getRiskLevel(fallbackScore);
}

function normalizeAlert(alert: any): AlertItem {
  return {
    id: String(alert.id ?? `ALT-${alert.project_id ?? "UNKNOWN"}`),
    projectId: String(alert.project_id ?? "UNKNOWN"),
    projectName: String(alert.project_name ?? "Unknown project"),
    category: String(alert.category ?? "Warning"),
    level: getRiskLevelFromBackend(alert.level, 0),
    title: String(alert.title ?? "Project warning"),
    text: String(alert.message ?? alert.text ?? "Project indicator requires review."),
    status: String(alert.status ?? "Active"),
  };
}


export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertError, setAlertError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("Overview");
  const [showAddProject, setShowAddProject] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function openProject(project: Project) {
    setSelectedProject(project);
    setDetailLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Project detail API returned ${response.status}`);
      }

      const data = await response.json();
      const rawProject = data?.project ?? data;
      setSelectedProject(normalizeProject(rawProject));
    } catch (err) {
      // The list endpoint already contains enough data to show the project.
      // Keep the selected project open if the optional detail endpoint is unavailable.
      console.warn("Project detail API unavailable; using live project data.", err);
    } finally {
      setDetailLoading(false);
    }
  }

  const loadProjects = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setError("");

    const [projectsResult, alertsResult] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/projects/`, { cache: "no-store" }),
      fetch(`${API_BASE_URL}/api/projects/alerts`, { cache: "no-store" }),
    ]);

    try {
      if (projectsResult.status === "rejected") {
        throw projectsResult.reason;
      }

      const projectsResponse = projectsResult.value;
      const data = await projectsResponse.json().catch(() => null);

      if (!projectsResponse.ok) {
        const detail =
          data?.detail
            ? typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
            : `HTTP ${projectsResponse.status}`;
        throw new Error(`Project API error: ${detail}`);
      }

      const sourceProjects = Array.isArray(data?.projects) ? data.projects : [];
      setProjects(sourceProjects.map(normalizeProject));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("AIPA API error:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(
        /failed to fetch|networkerror|load failed/i.test(message)
          ? `Unable to reach ${API_BASE_URL}. Check that FastAPI is running and that CORS allows the Next.js app origin.`
          : message
      );
    }

    try {
      if (alertsResult.status === "rejected") throw alertsResult.reason;

      const alertsResponse = alertsResult.value;
      const alertData = await alertsResponse.json().catch(() => null);

      if (!alertsResponse.ok) {
        throw new Error(
          alertData?.detail
            ? typeof alertData.detail === "string" ? alertData.detail : JSON.stringify(alertData.detail)
            : `Early warning API returned ${alertsResponse.status}`
        );
      }

      setAlerts(
        Array.isArray(alertData?.alerts)
          ? alertData.alerts.map(normalizeAlert)
          : []
      );
      setAlertError("");
    } catch (err) {
      console.warn("Early warning API error:", err);
      setAlertError(err instanceof Error ? err.message : "Unable to load early warnings.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);


  useEffect(() => {
    void loadProjects();

    const interval = window.setInterval(() => {
      void loadProjects({ silent: true });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadProjects]);

  async function createProject(form: CreateProjectForm) {
    setCreateLoading(true);
    setCreateError("");

    try {
      const objectives = form.objectives
        .map((objective) => ({
          title: objective.title.trim(),
          description: objective.description.trim(),
          weight: Number(objective.weight),
          metrics: objective.metrics
            .filter((metric) => metric.name.trim())
            .map((metric) => ({
              name: metric.name.trim(),
              kind: metric.kind,
              unit: metric.unit.trim(),
              baseline: Number(metric.baseline),
              target: Number(metric.target),
              current_value: Number(metric.current_value),
              expected_value:
                metric.expected_value.trim() === "" ? null : Number(metric.expected_value),
              weight: Number(metric.weight),
              evidence_required: metric.evidence_required,
            })),
        }))
        .filter((objective) => objective.title && objective.metrics.length);

      if (!form.name.trim() || !form.state.trim() || !form.location.trim()) {
        throw new Error("Project name, state and location are required.");
      }

      if (!objectives.length) {
        throw new Error("Add at least one objective with one measurable metric.");
      }

      for (const objective of objectives) {
        if (!Number.isFinite(objective.weight) || objective.weight <= 0) {
          throw new Error(`Objective "${objective.title}" needs a weight greater than 0.`);
        }
        for (const metric of objective.metrics) {
          if (!Number.isFinite(metric.baseline) || metric.baseline < 0) {
            throw new Error(`Metric "${metric.name}" needs a valid baseline.`);
          }
          if (!Number.isFinite(metric.target) || metric.target <= metric.baseline) {
            throw new Error(`Metric "${metric.name}" needs a target greater than its baseline.`);
          }
          if (!Number.isFinite(metric.current_value) || metric.current_value < 0) {
            throw new Error(`Metric "${metric.name}" needs a valid current value.`);
          }
          if (metric.expected_value !== null && (!Number.isFinite(metric.expected_value) || metric.expected_value < 0)) {
            throw new Error(`Metric "${metric.name}" has an invalid expected value.`);
          }
          if (!Number.isFinite(metric.weight) || metric.weight <= 0) {
            throw new Error(`Metric "${metric.name}" needs a weight greater than 0.`);
          }
        }
      }

      const expectedProgress = Number(form.expected_progress);
      const approvedCost = Number(form.approved_cost);
      const currentExpenditure = Number(form.current_expenditure);

      if (!Number.isFinite(expectedProgress) || expectedProgress < 0 || expectedProgress > 100) {
        throw new Error("Expected overall progress must be between 0 and 100.");
      }
      if (!Number.isFinite(approvedCost) || approvedCost < 0) {
        throw new Error("Approved budget must be a valid non-negative number.");
      }
      if (!Number.isFinite(currentExpenditure) || currentExpenditure < 0) {
        throw new Error("Current expenditure must be a valid non-negative number.");
      }

      const payload = {
        name: form.name.trim(),
        project_type: form.project_type,
        description: form.description.trim(),
        sector: form.sector.trim() || form.project_type,
        state: form.state.trim(),
        location: form.location.trim(),
        start_date: form.start_date || null,
        target_date: form.target_date || null,
        approved_cost: approvedCost,
        current_expenditure: currentExpenditure,
        physical_progress: 0,
        expected_progress: expectedProgress,
        status: form.status,
        progress_model: "universal",
        objectives,
      };

      const response = await fetch(`${API_BASE_URL}/api/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.detail
            ? typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail)
            : data?.error || `Create project failed with status ${response.status}.`;
        throw new Error(message);
      }

      let created = normalizeProject(data?.project ?? data);

      // Evidence is attached after the project exists because the backend needs
      // the generated project id. Each item can be a device file or a source URL.
      if (form.evidence.length > 0) {
        const evidenceErrors: string[] = [];

        for (const draft of form.evidence) {
          let metric = null;
          if (draft.metricKey) {
            const [objectiveIndex, metricIndex] = draft.metricKey.split(":").map(Number);
            metric = created.objectives[objectiveIndex]?.metrics[metricIndex] ?? null;
          }

          try {
            if (draft.file) {
              const body = new FormData();
              body.append("file", draft.file);
              if (metric) body.append("metric_id", String(metric.id));
              body.append("evidence_type", draft.evidenceType);
              body.append("confidence", String(Number(draft.confidence) || 50));
              body.append("notes", draft.notes.trim());

              const uploadResponse = await fetch(
                `${API_BASE_URL}/api/projects/${encodeURIComponent(created.id)}/evidence/upload`,
                { method: "POST", body }
              );
              const uploadData = await uploadResponse.json().catch(() => null);

              if (!uploadResponse.ok) {
                evidenceErrors.push(
                  `${draft.file.name}: ${uploadData?.detail || `upload failed (${uploadResponse.status})`}`
                );
              }
            } else {
              const reference = draft.reference.trim();
              if (!isHttpUrl(reference)) {
                evidenceErrors.push(
                  `${draft.sourceName || "Evidence link"}: enter a valid http:// or https:// URL.`
                );
                continue;
              }

              const response = await fetch(
                `${API_BASE_URL}/api/projects/${encodeURIComponent(created.id)}/evidence`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    metric_id: metric ? String(metric.id) : null,
                    evidence_type: draft.evidenceType,
                    source_name: draft.sourceName.trim() || reference,
                    reference,
                    confidence: Number(draft.confidence) || 50,
                    notes: draft.notes.trim(),
                  }),
                }
              );
              const data = await response.json().catch(() => null);

              if (!response.ok) {
                evidenceErrors.push(
                  `${draft.sourceName || reference}: ${data?.detail || `link save failed (${response.status})`}`
                );
              }
            }
          } catch (evidenceError) {
            const label = draft.file?.name || draft.sourceName || draft.reference || "Evidence";
            evidenceErrors.push(
              `${label}: ${evidenceError instanceof Error ? evidenceError.message : "evidence save failed"}`
            );
          }
        }

        if (evidenceErrors.length) {
          throw new Error(
            `Project created, but some evidence could not be saved: ${evidenceErrors.join("; ")}`
          );
        }

        const refreshedResponse = await fetch(
          `${API_BASE_URL}/api/projects/${encodeURIComponent(created.id)}`,
          { cache: "no-store" }
        );
        if (refreshedResponse.ok) {
          const refreshedData = await refreshedResponse.json();
          created = normalizeProject(refreshedData?.project ?? refreshedData);
        }
      }

      setProjects((current) => [
        ...current.filter((project) => project.id !== created.id),
        created,
      ]);
      setShowAddProject(false);
      setCreateError("");
      setActiveSection("All Projects");

      // Refresh in the background; creation should not look failed if a later
      // refresh request has a transient network problem.
      void loadProjects({ silent: true });
    } catch (err) {
      console.error("Create project error:", err);
      const message = err instanceof Error ? err.message : "Unable to create the project.";
      setCreateError(
        /failed to fetch|networkerror|load failed/i.test(message)
          ? `Could not reach ${API_BASE_URL}. Check FastAPI/CORS, then try again.`
          : message
      );
    } finally {
      setCreateLoading(false);
    }
  }


  async function deleteProject(projectId: string) {
    const project = projects.find((item) => item.id === projectId);

    if (!project) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleteLoadingId(projectId);
    setDeleteError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.detail
            ? typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail)
            : data?.error ||
              `Delete project failed with status ${response.status}.`;

        throw new Error(message);
      }

      setProjects((current) =>
        current.filter((item) => item.id !== projectId)
      );

      setSelectedProject((current) =>
        current?.id === projectId ? null : current
      );
    } catch (err) {
      console.error("Delete project error:", err);
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Unable to delete the project."
      );
    } finally {
      setDeleteLoadingId(null);
    }
  }

  const metrics = useMemo(() => {
    const totalProjects = projects.length;
    const highRiskProjects = projects.filter((project) => project.risk >= 65).length;
    const scheduleDelays = projects.filter(
      (project) => project.progress < project.expected
    ).length;
    const totalExpenditure = projects.reduce(
      (sum, project) => sum + project.currentExpenditure,
      0
    );
    const averageProgress = totalProjects
      ? projects.reduce((sum, project) => sum + project.progress, 0) / totalProjects
      : 0;
    const averageExpected = totalProjects
      ? projects.reduce((sum, project) => sum + project.expected, 0) / totalProjects
      : 0;
    const averageRisk = totalProjects
      ? projects.reduce((sum, project) => sum + project.risk, 0) / totalProjects
      : 0;
    const states = new Set(projects.map((project) => project.state).filter(Boolean));

    const riskCounts: Record<RiskLevel, number> = {
      Critical: projects.filter((project) => project.riskLevel === "Critical").length,
      High: projects.filter((project) => project.riskLevel === "High").length,
      Medium: projects.filter((project) => project.riskLevel === "Medium").length,
      Low: projects.filter((project) => project.riskLevel === "Low").length,
    };

    const delayedPercent = totalProjects ? (scheduleDelays / totalProjects) * 100 : 0;
    const highRiskPercent = totalProjects
      ? (highRiskProjects / totalProjects) * 100
      : 0;

    return {
      totalProjects,
      highRiskProjects,
      scheduleDelays,
      totalExpenditure,
      averageProgress,
      averageExpected,
      averageRisk,
      statesCount: states.size,
      riskCounts,
      delayedPercent,
      highRiskPercent,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) =>
      [project.id, project.name, project.state, project.sector, project.status]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [projects, searchTerm]);

  const activeAlerts = useMemo(() => {
    const seen = new Set<string>();
    return alerts.filter((alert) => {
      if (alert.status.toLowerCase() !== "active") return false;

      // The API should return unique alert IDs, but older backend versions can
      // emit the same code for multiple metric-level warnings. Keep distinct
      // metric warnings while suppressing exact duplicate payloads.
      const signature = [
        alert.id,
        alert.projectId,
        alert.category,
        alert.title,
        alert.text,
      ].join("|");
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }, [alerts]);

  const expenditureWarnings = useMemo(
    () =>
      projects.filter((project) => {
        if (!project.approvedCost) return false;
        const spendPercent = (project.currentExpenditure / project.approvedCost) * 100;
        return spendPercent > project.progress + 10;
      }),
    [projects]
  );

  const chartProjects = useMemo(
    () => [...projects].sort((a, b) => a.id.localeCompare(b.id)).slice(0, 12),
    [projects]
  );

  const chartPoints = useMemo(() => {
    if (!chartProjects.length) return { actual: "", expected: "", area: "" };

    const width = 900;
    const height = 180;
    const step = chartProjects.length === 1 ? width : width / (chartProjects.length - 1);
    const y = (value: number) => height - (Math.max(0, Math.min(100, value)) / 100) * height;

    const actual = chartProjects
      .map((project, index) => `${index * step},${y(project.progress).toFixed(1)}`)
      .join(" ");
    const expected = chartProjects
      .map((project, index) => `${index * step},${y(project.expected).toFixed(1)}`)
      .join(" ");

    const area = `0,${height} ${actual} ${width},${height}`;
    return { actual, expected, area };
  }, [chartProjects]);

  const statePoints = useMemo(() => {
    const coordinates: Record<string, { left: string; top: string }> = {
      Telangana: { left: "52%", top: "32%" },
      Maharashtra: { left: "47%", top: "44%" },
      Karnataka: { left: "58%", top: "54%" },
      "Tamil Nadu": { left: "62%", top: "68%" },
      Delhi: { left: "54%", top: "20%" },
      Rajasthan: { left: "43%", top: "25%" },
      Gujarat: { left: "38%", top: "36%" },
      Kerala: { left: "56%", top: "76%" },
    };

    const states = Array.from(new Set(projects.map((project) => project.state))).slice(0, 6);
    return states.map((state: string, index) => {
        const known = coordinates[state];
        return {
          state,
          left: known?.left ?? `${35 + ((index * 11) % 35)}%`,
          top: known?.top ?? `${25 + ((index * 13) % 50)}%`,
          risk: Math.round(
            projects
              .filter((project) => project.state === state)
              .reduce((sum, project) => sum + project.risk, 0) /
              Math.max(1, projects.filter((project) => project.state === state).length)
          ),
        };
      });
  }, [projects]);

  const today = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const portfolioRisk = Math.round(metrics.averageRisk);
  const riskStatus = riskLabel(portfolioRisk);

  const scrollToProjects = useCallback(() => {
    document.getElementById("projects-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const lastUpdatedLabel = lastUpdated
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(lastUpdated)
    : "Waiting for first sync";

  return (
    <main className="pv-shell min-h-screen overflow-x-hidden bg-[#050816] text-white">
    <style jsx global>{`
      @keyframes pv-enter {
        from { opacity: 0; transform: translateY(10px) scale(.992); filter: blur(2px); }
        to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
      }
      @keyframes pv-float {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(12px, -14px, 0) scale(1.04); }
      }
      @keyframes pv-sweep {
        0% { transform: translateX(-120%); opacity: 0; }
        15% { opacity: .65; }
        55% { opacity: .2; }
        100% { transform: translateX(220%); opacity: 0; }
      }
      @keyframes pv-pulseGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,.0), 0 0 22px rgba(37,99,235,.04); }
        50% { box-shadow: 0 0 0 5px rgba(34,211,238,.025), 0 0 34px rgba(37,99,235,.13); }
      }
      @keyframes pv-shimmer {
        0% { background-position: -220% 0; }
        100% { background-position: 220% 0; }
      }
      .pv-enter-section { animation: pv-enter .65s cubic-bezier(.22,1,.36,1) both; }
      .pv-shell { animation: pv-enter .7s cubic-bezier(.22,1,.36,1) both; }
      .pv-orb { animation: pv-float 9s ease-in-out infinite; }
      .pv-orb-slow { animation: pv-float 13s ease-in-out infinite reverse; }
      .pv-live-card { animation: pv-pulseGlow 3.5s ease-in-out infinite; }
      .pv-sweep { position: absolute; inset-y: 0; left: 0; width: 34%; background: linear-gradient(90deg, transparent, rgba(34,211,238,.11), transparent); transform: translateX(-120%); animation: pv-sweep 6s ease-in-out infinite; pointer-events: none; }
      .pv-interactive { transition: transform .28s cubic-bezier(.22,1,.36,1), border-color .28s ease, background-color .28s ease, box-shadow .28s ease; }
      .pv-interactive:hover { transform: translateY(-4px); border-color: rgba(96,165,250,.22) !important; box-shadow: 0 18px 55px rgba(2,8,23,.48), 0 0 34px rgba(37,99,235,.07); }
      .pv-interactive:active { transform: translateY(-1px) scale(.995); }
      .glass-card { position: relative; overflow: hidden; }
      .glass-card::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(115deg, transparent 20%, rgba(255,255,255,.025) 42%, transparent 64%); background-size: 220% 100%; opacity: 0; transition: opacity .3s ease; }
      .glass-card:hover::after { opacity: 1; animation: pv-shimmer 1.8s ease-out; }
      button:not(:disabled) { transition: transform .18s cubic-bezier(.22,1,.36,1), filter .18s ease, box-shadow .18s ease, border-color .18s ease, background-color .18s ease, color .18s ease; }
      button:not(:disabled):active { transform: scale(.96); }
      .pv-grid-bg { background-image: linear-gradient(rgba(56,189,248,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.035) 1px, transparent 1px); background-size: 42px 42px; mask-image: linear-gradient(to bottom, black, transparent 78%); }
      @media (prefers-reduced-motion: reduce) {
        .pv-shell, .pv-orb, .pv-orb-slow, .pv-live-card, .pv-sweep { animation: none !important; }
        *, *::before, *::after { scroll-behavior: auto !important; }
      }
    `}</style>
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="pv-orb absolute left-[20%] top-[-300px] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="pv-orb-slow absolute right-[-150px] top-[25%] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.07] blur-[150px]" />
        <div className="pv-grid-bg absolute inset-0 opacity-70" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.08] bg-[#050816]/80 backdrop-blur-2xl">
        <div className="flex h-[68px] items-center justify-between px-4 md:px-7">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="pv-live-card relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
              <Activity size={21} strokeWidth={2.5} />
              <div className="absolute inset-0 bg-white/10" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-wide">
                  AIPA <span className="text-cyan-400">AI</span>
                </h1>
                <span className="hidden rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-300 sm:block">
                  Intelligence
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Infrastructure monitoring & early warning
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <label className="flex w-64 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
              <Search size={15} className="text-slate-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search projects, states..."
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
              />
              <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-600">
                /
              </span>
            </label>

            <button
              type="button"
              onClick={() => void loadProjects({ silent: true })}
              disabled={refreshing || loading}
              className="group flex items-center gap-2 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] px-3 py-2.5 text-slate-400 transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.06] hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Refresh project data"
              title={`Last sync: ${lastUpdatedLabel}`}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin text-cyan-300" : "transition-transform group-hover:rotate-90"}
              />
              <span className="hidden xl:inline text-[9px] font-semibold">
                {refreshing ? "SYNCING" : "SYNC"}
              </span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((current) => !current)}
                className="relative rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5 text-slate-400 transition hover:border-white/15 hover:text-white"
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <Bell size={17} />
                {activeAlerts.length > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,.8)]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 z-[70] w-[360px] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#080d1a]/95 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold">Notifications</p>
                      <p className="mt-0.5 text-[9px] text-slate-600">Live early warnings from the risk engine</p>
                    </div>
                    <span className="rounded-full bg-red-500/10 px-2 py-1 text-[8px] font-bold text-red-300">
                      {activeAlerts.length} ACTIVE
                    </span>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {activeAlerts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-[10px] text-slate-600">
                        No active warnings.
                      </div>
                    ) : (
                      activeAlerts.slice(0, 8).map((alert) => (
                        <button
                          key={alert.id}
                          type="button"
                          onClick={() => {
                            const project = projects.find((item) => item.id === alert.projectId);
                            setShowNotifications(false);
                            if (project) void openProject(project);
                          }}
                          className="flex w-full items-start gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition hover:bg-white/[0.035]"
                        >
                          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            alert.level === "Critical" ? "bg-red-400" :
                            alert.level === "High" ? "bg-orange-400" :
                            alert.level === "Medium" ? "bg-amber-400" : "bg-emerald-400"
                          }`} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-[10px] font-semibold text-white">{alert.title}</span>
                              <span className="shrink-0 text-[8px] font-bold text-slate-600">{alert.projectId}</span>
                            </span>
                            <span className="mt-1 block text-[9px] leading-relaxed text-slate-500">{alert.text}</span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold">
                GO
              </div>
              <div className="hidden xl:block">
                <p className="text-[10px] font-medium">Monitoring Officer</p>
                <p className="text-[9px] text-slate-600">Government Portal</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex pt-[68px]">
        <aside
          className={`fixed bottom-0 left-0 top-[68px] z-40 w-[245px] border-r border-white/[0.07] bg-[#070b17]/95 backdrop-blur-2xl transition-transform lg:sticky lg:top-[68px] lg:block lg:h-[calc(100vh-68px)] lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col p-4">
            <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
              Command Center
            </p>

            <nav className="space-y-1">
              <NavItem
                icon={<Activity size={16} />}
                label="Overview"
                active={activeSection === "Overview"}
                onClick={() => { setActiveSection("Overview"); setMobileOpen(false); }}
              />
              <NavItem
                icon={<Building2 size={16} />}
                label="All Projects"
                badge={String(metrics.totalProjects)}
                active={activeSection === "All Projects"}
                onClick={() => { setActiveSection("All Projects"); setMobileOpen(false); }}
              />
              <NavItem
                icon={<ShieldAlert size={16} />}
                label="Risk Intelligence"
                badge={String(metrics.highRiskProjects)}
                active={activeSection === "Risk Intelligence"}
                onClick={() => {
                  setActiveSection("Risk Intelligence");
                  setMobileOpen(false);
                }}
              />
              <NavItem
                icon={<TrendingUp size={16} />}
                label="Analytics"
                active={activeSection === "Analytics"}
                onClick={() => {
                  setActiveSection("Analytics");
                  setMobileOpen(false);
                  window.setTimeout(() => document.getElementById("analytics")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                }}
              />
              <NavItem
                icon={<Globe2 size={16} />}
                label="Risk Map"
                active={activeSection === "Risk Map"}
                onClick={() => {
                  setActiveSection("Risk Map");
                  setMobileOpen(false);
                  window.setTimeout(() => document.getElementById("risk-map")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
                }}
              />
            </nav>

            <p className="mb-3 mt-8 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
              Intelligence
            </p>

            <nav className="space-y-1">
              <NavItem
                icon={<AlertTriangle size={16} />}
                label="Early Warnings"
                badge={String(activeAlerts.length)}
                danger
                active={activeSection === "Early Warnings"}
                onClick={() => {
                  setActiveSection("Early Warnings");
                  setMobileOpen(false);
                  window.setTimeout(() => {
                    document.getElementById("early-warnings")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }, 0);
                }}
              />
              <NavItem
                icon={<CircleDollarSign size={16} />}
                label="Cost Intelligence"
                active={activeSection === "Cost Intelligence"}
                onClick={() => {
                  setActiveSection("Cost Intelligence");
                  setMobileOpen(false);
                  window.setTimeout(() => document.getElementById("portfolio-insight")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
                }}
              />
              <NavItem
                icon={<Clock3 size={16} />}
                label="Delay Prediction"
                active={activeSection === "Delay Prediction"}
                onClick={() => {
                  setActiveSection("Delay Prediction");
                  setMobileOpen(false);
                  window.setTimeout(() => document.getElementById("projects-section")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
                }}
              />
              <NavItem
                icon={<Bot size={16} />}
                label="AI Assistant"
                active={activeSection === "AI Assistant"}
                onClick={() => {
                  setActiveSection("AI Assistant");
                  setMobileOpen(false);
                  window.setTimeout(() => document.getElementById("portfolio-insight")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
                }}
              />
            </nav>

            <div className="mt-auto">
              <div className="pv-interactive pv-live-card overflow-hidden rounded-2xl border border-blue-400/10 bg-gradient-to-br from-blue-500/[0.08] to-cyan-400/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[9px] font-bold tracking-wider text-emerald-400">
                    {error ? "API OFFLINE" : loading ? "CONNECTING..." : "API ONLINE"}
                  </span>
                </div>

                <p className="text-[10px] leading-relaxed text-slate-500">
                  {error
                    ? "The dashboard could not reach the FastAPI project service."
                    : "Project monitoring data is being loaded directly from the AIPA API."}
                </p>

                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all ${
                      loading ? "w-1/2 animate-pulse" : error ? "w-1/4" : "w-full"
                    }`}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[8px] text-slate-600">
                  <span>Connection</span>
                  <span>{error ? "0%" : loading ? "50%" : "100%"}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1700px] p-4 md:p-7 lg:p-8">
            {activeSection === "All Projects" ? (
              <ProjectTableView
                projects={projects}
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onOpenProject={openProject}
                onDeleteProject={deleteProject}
                deletingProjectId={deleteLoadingId}
                onBack={() => setActiveSection("Overview")}
                onAddProject={() => {
                  setCreateError("");
                  setShowAddProject(true);
                }}
              />
            ) : activeSection === "Risk Intelligence" ? (
              <RiskAnalysisView
                projects={projects}
                loading={loading}
                onOpenProject={openProject}
                onBack={() => setActiveSection("Overview")}
              />
            ) : (
            <>
            <section className="pv-enter-section mb-7">
              <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-medium text-slate-500">
                    <span className={`relative flex h-1.5 w-1.5 ${refreshing ? "animate-pulse" : ""}`}>
                      <span className="absolute inset-0 rounded-full bg-cyan-400 opacity-50 blur-[2px]" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,.8)]" />
                    </span>
                    LIVE MONITORING
                    <span className="text-slate-700">•</span>
                    {today}
                  </div>

                  <h2 className="text-3xl font-bold tracking-[-0.04em] md:text-4xl">
                    Infrastructure{" "}
                    <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                      Intelligence
                    </span>
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                    Monitor project performance, identify emerging risks, and act before delays and cost overruns become critical.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]">
                      <CalendarDays size={14} />
                      Live portfolio
                    </button>
                    <button
                    onClick={() => document.getElementById("portfolio-insight")?.scrollIntoView({ behavior: "smooth" })}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-xs font-semibold shadow-lg shadow-blue-600/20 transition hover:brightness-110"
                  >
                    <Sparkles size={14} />
                    AI Insights
                  </button>
                  </div>

                  <div className="flex items-center gap-2 text-[8px] text-slate-600">
                    <span className={`h-1.5 w-1.5 rounded-full ${refreshing ? "animate-pulse bg-cyan-400" : "bg-emerald-400"}`} />
                    {refreshing ? "Synchronizing live data…" : `Last sync ${lastUpdatedLabel}`}
                    <span className="text-slate-700">·</span>
                    <span>Auto refresh 30s</span>
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* KPI GRID */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi
                icon={<Building2 size={17} />}
                title="Monitored Projects"
                value={loading ? "—" : String(metrics.totalProjects)}
                detail={`Across ${metrics.statesCount} monitored states`}
                change="LIVE"
                positive
                gradient="blue"
                onClick={() => setActiveSection("All Projects")}
              />
              <Kpi
                icon={<ShieldAlert size={17} />}
                title="High Risk Projects"
                value={loading ? "—" : String(metrics.highRiskProjects)}
                detail={`${formatPercent(metrics.highRiskPercent)} of portfolio`}
                change="LIVE"
                gradient="red"
                onClick={() => setActiveSection("Risk Intelligence")}
              />
              <Kpi
                icon={<Clock3 size={17} />}
                title="Schedule Delays"
                value={loading ? "—" : String(metrics.scheduleDelays)}
                detail={`${formatPercent(metrics.delayedPercent)} of projects`}
                change="LIVE"
                gradient="amber"
                onClick={scrollToProjects}
              />
              <Kpi
                icon={<CircleDollarSign size={17} />}
                title="Current Expenditure"
                value={loading ? "—" : formatCr(metrics.totalExpenditure)}
                detail="Sum of current project expenditure"
                change="LIVE"
                positive
                gradient="cyan"
                onClick={scrollToProjects}
              />
            </div>

            {/* TOP ANALYTICS */}
            <div id="analytics" className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_0.85fr]">
              <div id="early-warnings" className="glass-card pv-interactive overflow-hidden">
                <span className="pv-sweep" />
                <div className="flex items-start justify-between border-b border-white/[0.06] px-5 py-4 md:px-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Portfolio Performance</h3>
                      <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[8px] font-bold text-emerald-400">
                        LIVE
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-600">
                      Current physical progress vs expected progress
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[9px]">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      Actual
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      Expected
                    </span>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-4 md:px-6">
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-bold tracking-tight">
                        {loading ? "—" : formatPercent(metrics.averageProgress)}
                      </span>
                      <span className="ml-2 text-[10px] text-slate-500">
                        expected {formatPercent(metrics.averageExpected)}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-600">
                      {chartProjects.length} projects plotted
                    </span>
                  </div>

                  <div className="relative h-[190px]">
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[100, 75, 50, 25, 0].map((n) => (
                        <div key={n} className="flex items-center gap-3 text-[8px] text-slate-700">
                          <span className="w-5">{n}%</span>
                          <div className="h-px flex-1 bg-white/[0.045]" />
                        </div>
                      ))}
                    </div>

                    <div className="absolute bottom-0 left-8 right-0 top-2">
                      {chartProjects.length > 0 ? (
                        <svg
                          viewBox="0 0 900 180"
                          className="h-full w-full overflow-visible"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity=".28" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          <polygon points={chartPoints.area} fill="url(#areaGradient)" />
                          <polyline
                            points={chartPoints.actual}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            vectorEffect="non-scaling-stroke"
                          />
                          <polyline
                            points={chartPoints.expected}
                            fill="none"
                            stroke="#475569"
                            strokeWidth="1.5"
                            strokeDasharray="5 5"
                            vectorEffect="non-scaling-stroke"
                          />

                          {chartProjects.map((project, index) => {
                            const x = chartProjects.length === 1 ? 450 : (index / (chartProjects.length - 1)) * 900;
                            const y = 180 - (project.progress / 100) * 180;
                            return (
                              <circle
                                key={project.id}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="#22d3ee"
                                stroke="#050816"
                                strokeWidth="3"
                              />
                            );
                          })}
                        </svg>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-600">
                          {loading ? "Loading project data…" : "No project data available"}
                        </div>
                      )}
                    </div>

                    {chartProjects.length > 0 && (
                      <div className="absolute bottom-[-18px] left-8 right-0 flex justify-between text-[8px] text-slate-700">
                        {chartProjects.map((project) => (
                          <span key={project.id} className="max-w-12 truncate" title={project.id}>
                            {project.id.replace("PRJ-", "")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RISK GAUGE */}
              <div className="glass-card pv-interactive">
                <span className="pv-sweep" />
                <div className="border-b border-white/[0.06] px-5 py-4">
                  <h3 className="text-sm font-semibold">Portfolio Risk</h3>
                  <p className="mt-1 text-[10px] text-slate-600">
                    Calculated from live project risk scores
                  </p>
                </div>

                <div className="flex flex-col items-center px-5 py-5">
                  <div className="relative flex h-44 w-44 items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(#ef4444 0deg 90deg, #f97316 90deg 180deg, #f59e0b 180deg 270deg, #10b981 270deg 360deg)`,
                        mask: "radial-gradient(farthest-side, transparent calc(100% - 13px), #000 0)",
                        WebkitMask:
                          "radial-gradient(farthest-side, transparent calc(100% - 13px), #000 0)",
                      }}
                    />
                    <div className="absolute inset-5 rounded-full border border-white/[0.04] bg-[#0a0f1c]" />

                    <div className="relative text-center">
                      <p className="text-4xl font-bold tracking-tight">{loading ? "—" : portfolioRisk}</p>
                      <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-slate-600">
                        Risk Index
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-orange-400/10 px-2 py-1 text-[8px] font-bold text-orange-400">
                        {loading ? "LOADING" : riskStatus}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid w-full grid-cols-2 gap-2">
                    <RiskLegend color="bg-red-500" label="Critical" value={String(metrics.riskCounts.Critical)} />
                    <RiskLegend color="bg-orange-500" label="High" value={String(metrics.riskCounts.High)} />
                    <RiskLegend color="bg-amber-400" label="Medium" value={String(metrics.riskCounts.Medium)} />
                    <RiskLegend color="bg-emerald-400" label="Low" value={String(metrics.riskCounts.Low)} />
                  </div>
                </div>
              </div>
            </div>

            {/* PROJECTS + WARNINGS */}
            <div id="projects-section" className="mt-5 scroll-mt-24 grid gap-5 xl:grid-cols-[1fr_390px]">
              <div className="glass-card pv-interactive overflow-hidden">
                <span className="pv-sweep" />
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 md:px-6">
                  <div>
                    <h3 className="text-sm font-semibold">Projects Requiring Attention</h3>
                    <p className="mt-1 text-[10px] text-slate-600">
                      {searchTerm
                        ? `${filteredProjects.length} matching projects`
                        : "Live project data from the AIPA API"}
                    </p>
                  </div>

                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-[10px] font-medium text-blue-400 hover:text-blue-300"
                    >
                      Clear search
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-left text-[8px] uppercase tracking-[0.14em] text-slate-600">
                        <th className="px-5 py-3 font-semibold">Project</th>
                        <th className="px-3 py-3 font-semibold">Progress</th>
                        <th className="px-3 py-3 font-semibold">Cost Risk</th>
                        <th className="px-3 py-3 font-semibold">Delay Risk</th>
                        <th className="px-5 py-3 text-right font-semibold">Score</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-600">
                            Loading projects from API…
                          </td>
                        </tr>
                      ) : filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-600">
                            No projects match your search.
                          </td>
                        </tr>
                      ) : (
                        [...filteredProjects]
                          .sort((a, b) => b.risk - a.risk)
                          .map((project) => (
                            <tr
                              key={project.id}
                              onClick={() => openProject(project)}
                              className="group cursor-pointer border-b border-white/[0.04] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-500/[0.055] hover:shadow-[inset_3px_0_0_rgba(56,189,248,.75),0_8px_25px_rgba(2,8,23,.18)]"
                              title={`Open ${project.name}`}
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${riskIconClass(project.riskLevel)}`}
                                  >
                                    <Building2 size={15} />
                                  </div>

                                  <div>
                                    <p className="max-w-[230px] truncate text-xs font-semibold">
                                      {project.name}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2 text-[9px] text-slate-600">
                                      <span>{project.id}</span>
                                      <span>•</span>
                                      <span>{project.state}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-3 py-4">
                                <div className="w-28">
                                  <div className="mb-1.5 flex justify-between text-[8px]">
                                    <span className="text-slate-600">Actual</span>
                                    <span>{project.progress}%</span>
                                  </div>

                                  <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                    <div
                                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                                      style={{ width: `${project.progress}%` }}
                                    />
                                  </div>

                                  <p className="mt-1 text-[8px] text-slate-700">
                                    Expected {project.expected}%
                                  </p>
                                </div>
                              </td>

                              <td className="px-3 py-4">
                                <RiskBadge level={project.costRisk} />
                              </td>

                              <td className="px-3 py-4">
                                <RiskBadge level={project.delayRisk} />
                              </td>

                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <div className="inline-flex items-center gap-2">
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${riskDotClass(project.risk)}`}
                                    />
                                    <span className="text-sm font-bold">{Math.round(project.risk)}</span>
                                    <span className="text-[8px] text-slate-700">/100</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openProject(project);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-400/10 bg-blue-500/[0.06] px-2 py-1.5 text-[9px] font-semibold text-blue-400 transition hover:border-blue-400/25 hover:bg-blue-500/10 hover:text-blue-300"
                                  >
                                    Investigate
                                    <ChevronRight size={11} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EARLY WARNING */}
              <div className="glass-card pv-interactive overflow-hidden">
                <span className="pv-sweep" />
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <div>
                    <h3 className="text-sm font-semibold">Project Warnings</h3>
                    <p className="mt-1 text-[10px] text-slate-600">
                      Derived from current project indicators
                    </p>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                    <AlertTriangle size={15} />
                  </div>
                </div>

                <div>
                  {activeAlerts.length === 0 ? (
                    <div className="p-5 text-xs text-slate-600">
                      No warnings available yet.
                    </div>
                  ) : (
                    activeAlerts.map((alert, index) => (
                      <div
                        key={`${alert.id}-${alert.projectId}-${alert.category}-${index}`}
                        className="border-b border-white/[0.05] p-5 transition hover:bg-white/[0.02]"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-600">{alert.projectId}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-600">{alert.category}</span>
                            <RiskBadge level={alert.level} />
                          </div>
                        </div>

                        <h4 className="text-xs font-semibold leading-relaxed">{alert.title}</h4>
                        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
                          {alert.text}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[8px] text-slate-700">Live</span>
                          <button
                            type="button"
                            onClick={() => {
                              const project = projects.find((item) => item.id === alert.projectId);
                              if (project) openProject(project);
                            }}
                            className="flex items-center gap-1 text-[9px] font-semibold text-blue-400 transition hover:text-blue-300"
                          >
                            Investigate
                            <ChevronRight size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {activeAlerts.length > 0 && (
                  <div className="flex w-full items-center justify-center gap-1 py-3 text-[9px] font-semibold text-slate-500">
                    {activeAlerts.length} active warning{activeAlerts.length === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            </div>

            {alertError && (
              <div className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3 text-[10px] text-amber-300">
                Early warning engine unavailable: {alertError}
              </div>
            )}

            {/* BOTTOM INTELLIGENCE */}
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <div id="risk-map" className="glass-card pv-interactive relative min-h-[270px] overflow-hidden lg:col-span-2">
                <div className="relative z-10 flex items-start justify-between px-5 py-4">
                  <div>
                    <h3 className="text-sm font-semibold">Geospatial Risk Intelligence</h3>
                    <p className="mt-1 text-[10px] text-slate-600">
                      States represented in the live project portfolio
                    </p>
                  </div>

                  <MapPin size={16} className="text-cyan-400" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 top-16 overflow-hidden">
                  <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(56,189,248,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.08)_1px,transparent_1px)] [background-size:35px_35px]" />

                  <div className="absolute left-[48%] top-[15%] h-40 w-32 rotate-[12deg] rounded-[45%_55%_48%_52%] border border-cyan-400/20 bg-cyan-400/[0.025] md:h-52 md:w-40" />

                  {statePoints.map((point) => (
                    <MapPoint
                      key={point.state}
                      left={point.left}
                      top={point.top}
                      color={mapRiskColor(point.risk)}
                      label={`${point.state} · ${point.risk}`}
                    />
                  ))}

                  <div className="absolute bottom-4 left-5 flex gap-4 rounded-xl border border-white/[0.07] bg-[#070b17]/80 px-3 py-2 backdrop-blur-xl">
                    <MapLegend color="bg-red-500" text="Critical" />
                    <MapLegend color="bg-orange-500" text="High" />
                    <MapLegend color="bg-amber-400" text="Medium" />
                    <MapLegend color="bg-emerald-400" text="Low" />
                  </div>
                </div>
              </div>

              {/* PORTFOLIO INSIGHT */}
              <div
                id="portfolio-insight"
                className="relative overflow-hidden rounded-2xl border border-blue-400/15 bg-gradient-to-br from-blue-500/[0.11] via-[#0c1222] to-cyan-500/[0.05] p-5"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative">
                  <div className="mb-5 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-cyan-300">
                      <Sparkles size={15} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold">Portfolio Intelligence</h3>
                      <p className="text-[9px] text-blue-300/60">
                        Derived from current project indicators
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-semibold leading-relaxed">
                    {expenditureWarnings.length} project{expenditureWarnings.length === 1 ? " is" : "s are"}{" "}
                    showing{" "}
                    <span className="text-cyan-300">expenditure ahead of progress</span>.
                  </p>

                  <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 p-3">
                    <p className="text-[9px] uppercase tracking-wider text-slate-600">
                      Portfolio status
                    </p>
                    <p className="mt-1 text-xs font-medium">
                      Average physical progress is {formatPercent(metrics.averageProgress)} against {formatPercent(metrics.averageExpected)} expected.
                    </p>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${Math.min(100, metrics.averageProgress)}%` }}
                      />
                    </div>

                    <div className="mt-1 flex justify-between text-[8px] text-slate-600">
                      <span>Physical progress</span>
                      <span>{formatPercent(metrics.averageProgress)}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div>
                      <p className="text-[9px] text-slate-600">Average risk</p>
                      <p className="mt-1 text-lg font-bold">{portfolioRisk}/100</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-600">Delayed projects</p>
                      <p className="mt-1 text-lg font-bold">{metrics.scheduleDelays}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}

            {selectedProject && (
              <ProjectDetailsModal
                project={selectedProject}
                alerts={activeAlerts.filter((alert) => alert.projectId === selectedProject.id)}
                loading={detailLoading}
                deleting={deleteLoadingId === selectedProject.id}
                error={deleteError}
                onDelete={deleteProject}
                onProjectUpdated={(updatedProject) => {
                  setSelectedProject(updatedProject);
                  setProjects((current) =>
                    current.map((item) =>
                      item.id === updatedProject.id ? updatedProject : item
                    )
                  );
                }}
                onClose={() => {
                  if (!deleteLoadingId) {
                    setSelectedProject(null);
                    setDetailLoading(false);
                    setDeleteError("");
                  }
                }}
              />
            )}

            {showAddProject && (
              <CreateProjectModal
                loading={createLoading}
                error={createError}
                onClose={() => {
                  if (!createLoading) {
                    setShowAddProject(false);
                    setCreateError("");
                  }
                }}
                onSubmit={createProject}
              />
            )}

            <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-white/[0.06] py-5 text-[9px] text-slate-700 md:flex-row">
              <span>AIPA AI · Intelligent Infrastructure Monitoring</span>
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${error ? "bg-red-400" : "bg-emerald-400"}`} />
                {error ? "API connection issue" : "Live API data connected"}
              </span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}


function ProjectTableView({
  projects,
  loading,
  searchTerm,
  onSearchChange,
  onOpenProject,
  onDeleteProject,
  deletingProjectId,
  onBack,
  onAddProject,
}: {
  projects: Project[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  deletingProjectId: string | null;
  onBack: () => void;
  onAddProject: () => void;
}) {
  const [riskFilter, setRiskFilter] = useState<"All" | RiskLevel>("All");
  const [sortBy, setSortBy] = useState<"risk" | "progress" | "name">("risk");

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const result = projects.filter((project) => {
      const matchesRisk = riskFilter === "All" || project.riskLevel === riskFilter;
      const matchesSearch = !query ||
        [project.id, project.name, project.state, project.sector, project.status]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesRisk && matchesSearch;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.risk - a.risk;
    });
  }, [projects, searchTerm, riskFilter, sortBy]);

  const counts: Record<RiskLevel, number> = {
    Critical: projects.filter((p) => p.riskLevel === "Critical").length,
    High: projects.filter((p) => p.riskLevel === "High").length,
    Medium: projects.filter((p) => p.riskLevel === "Medium").length,
    Low: projects.filter((p) => p.riskLevel === "Low").length,
  };

  return (
    <section>
      <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-4 text-[10px] font-semibold text-blue-400 transition hover:text-blue-300"
          >
            ← Back to Overview
          </button>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-medium text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,.8)]" />
            PROJECT PORTFOLIO
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.04em] md:text-4xl">
            All <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">Projects</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Search, filter, sort, and investigate every project currently available from the AIPA API.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <PortfolioCount label="Total" value={projects.length} />
          <PortfolioCount label="Critical" value={counts.Critical} danger />
          <PortfolioCount label="High" value={counts.High} danger />
          <PortfolioCount label="Delayed" value={projects.filter((p) => p.progress < p.expected).length} />
        </div>

        <button
          type="button"
          onClick={onAddProject}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:brightness-110"
        >
          <Plus size={14} />
          Add Project
        </button>
      </div>

      <div className="glass-card pv-interactive overflow-hidden">
                <span className="pv-sweep" />
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 md:p-5 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 lg:max-w-md">
            <Search size={15} className="shrink-0 text-slate-500" />
            <input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by project, state, sector..."
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
            />
            {searchTerm && (
              <button type="button" onClick={() => onSearchChange("")} className="text-slate-600 hover:text-white">
                <X size={14} />
              </button>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            {(["All", "Critical", "High", "Medium", "Low"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setRiskFilter(filter)}
                className={`rounded-lg border px-2.5 py-2 text-[9px] font-semibold transition ${
                  riskFilter === filter
                    ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
                    : "border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-white/[0.06] bg-[#0a0f1b] px-2.5 py-2 text-[9px] font-semibold text-slate-400 outline-none"
            >
              <option value="risk">Sort: Risk</option>
              <option value="progress">Sort: Progress</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        <div className="border-b border-white/[0.05] px-4 py-3 text-[9px] text-slate-600 md:px-5">
          Showing <span className="font-semibold text-slate-400">{filtered.length}</span> of {projects.length} projects
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.05] text-left text-[8px] uppercase tracking-[0.14em] text-slate-600">
                <th className="px-5 py-3 font-semibold">Project</th>
                <th className="px-3 py-3 font-semibold">Location</th>
                <th className="px-3 py-3 font-semibold">Progress</th>
                <th className="px-3 py-3 font-semibold">Cost Risk</th>
                <th className="px-3 py-3 font-semibold">Delay Risk</th>
                <th className="px-3 py-3 font-semibold">Risk</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-xs text-slate-600">Loading projects from API…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-xs text-slate-600">No projects match the current filters.</td></tr>
              ) : filtered.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="group cursor-pointer border-b border-white/[0.04] transition-all duration-200 hover:-translate-y-[1px] hover:bg-blue-500/[0.055] hover:shadow-[inset_3px_0_0_rgba(56,189,248,.75),0_8px_25px_rgba(2,8,23,.18)]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${riskIconClass(project.riskLevel)}`}>
                        <Building2 size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[280px] truncate text-xs font-semibold text-white">{project.name}</p>
                        <p className="mt-1 text-[9px] text-slate-600">{project.id} · {project.sector}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-[10px] text-slate-300">{project.state}</p>
                    <p className="mt-1 max-w-[150px] truncate text-[8px] text-slate-600">{project.location}</p>
                  </td>
                  <td className="px-3 py-4">
                    <div className="w-28">
                      <div className="mb-1.5 flex justify-between text-[8px]"><span className="text-slate-600">Actual</span><span>{project.progress}%</span></div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700 ease-out" style={{ width: `${project.progress}%` }} /></div>
                      <p className="mt-1 text-[8px] text-slate-700">Expected {project.expected}%</p>
                    </div>
                  </td>
                  <td className="px-3 py-4"><RiskBadge level={project.costRisk} /></td>
                  <td className="px-3 py-4"><RiskBadge level={project.delayRisk} /></td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${riskDotClass(project.risk)}`} /><span className="text-sm font-bold">{Math.round(project.risk)}</span><span className="text-[8px] text-slate-700">/100</span></div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProject(project);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-400/10 bg-blue-500/[0.06] px-2.5 py-1.5 text-[9px] font-semibold text-blue-400 transition hover:border-blue-400/25 hover:bg-blue-500/10 hover:text-blue-300"
                      >
                        Investigate <ChevronRight size={11} />
                      </button>

                      <button
                        type="button"
                        disabled={deletingProjectId === project.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void onDeleteProject(project.id);
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-red-500/10 bg-red-500/[0.05] p-2 text-red-400 transition hover:border-red-500/25 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                        title={`Delete ${project.name}`}
                        aria-label={`Delete ${project.name}`}
                      >
                        <Trash2
                          size={13}
                          className={deletingProjectId === project.id ? "animate-pulse" : ""}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


function CreateProjectModal({
  loading,
  error,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (form: CreateProjectForm) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateProjectForm>(() => emptyCreateForm());
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");

  function updateField(key: keyof CreateProjectForm, value: string) {
    setStepError("");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeType(projectType: string) {
    setStepError("");
    setForm((current) => ({
      ...current,
      project_type: projectType,
      // Keep one objective by default; the project type only changes
      // the suggested metrics inside that objective.
      objectives: buildObjectivesForType(projectType),
      sector: current.sector || projectType,
    }));
  }

  function updateObjective(index: number, patch: Partial<CreateObjectiveForm>) {
    setStepError("");
    setForm((current) => ({
      ...current,
      objectives: current.objectives.map((item, i) => i === index ? { ...item, ...patch } : item),
    }));
  }

  function updateMetric(objectiveIndex: number, metricIndex: number, patch: Partial<CreateMetricForm>) {
    setStepError("");
    setForm((current) => ({
      ...current,
      objectives: current.objectives.map((objective, i) =>
        i !== objectiveIndex
          ? objective
          : {
              ...objective,
              metrics: objective.metrics.map((metric, j) =>
                j === metricIndex ? { ...metric, ...patch } : metric
              ),
            }
      ),
    }));
  }

  function addObjective() {
    setStepError("");
    setForm((current) => ({
      ...current,
      objectives: [
        ...current.objectives,
        {
          title: `Objective ${current.objectives.length + 1}`,
          description: "",
          weight: "20",
          metrics: [blankMetric()],
        },
      ],
    }));
  }

  function addMetric(objectiveIndex: number) {
    setStepError("");
    setForm((current) => ({
      ...current,
      objectives: current.objectives.map((objective, i) =>
        i === objectiveIndex
          ? { ...objective, metrics: [...objective.metrics, blankMetric()] }
          : objective
      ),
    }));
  }

  function removeMetric(objectiveIndex: number, metricIndex: number) {
    setStepError("");
    setForm((current) => ({
      ...current,
      objectives: current.objectives.map((objective, i) =>
        i === objectiveIndex
          ? { ...objective, metrics: objective.metrics.filter((_, j) => j !== metricIndex) }
          : objective
      ),
    }));
  }

  function addEvidenceFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    setStepError("");
    setForm((current) => ({
      ...current,
      evidence: [
        ...current.evidence,
        ...files.map((file) => ({
          file,
          sourceName: file.name,
          reference: "",
          metricKey: "",
          evidenceType: "document",
          observedAt: "",
          confidence: "80",
          notes: "",
        })),
      ],
    }));
  }

  function addEvidenceLink() {
    setStepError("");
    setForm((current) => ({
      ...current,
      evidence: [
        ...current.evidence,
        {
          file: null,
          sourceName: "",
          reference: "",
          metricKey: "",
          evidenceType: "report",
          observedAt: "",
          confidence: "80",
          notes: "",
        },
      ],
    }));
  }

  function updateEvidence(index: number, patch: Partial<CreateEvidenceDraft>) {
    setStepError("");
    setForm((current) => ({
      ...current,
      evidence: current.evidence.map((item, i) => i === index ? { ...item, ...patch } : item),
    }));
  }

  function removeEvidence(index: number) {
    setStepError("");
    setForm((current) => ({
      ...current,
      evidence: current.evidence.filter((_, i) => i !== index),
    }));
  }

  function validateStep(stepIndex: number): string {
    if (stepIndex === 0) {
      if (!form.name.trim()) return "Project name is required.";
      if (!form.sector.trim()) return "Sector is required.";
      if (!form.state.trim()) return "State is required.";
      if (!form.location.trim()) return "Location / coverage area is required.";
      const approved = Number(form.approved_cost);
      const spent = Number(form.current_expenditure);
      const expected = Number(form.expected_progress);
      if (!Number.isFinite(approved) || approved < 0) return "Approved budget must be a valid non-negative number.";
      if (!Number.isFinite(spent) || spent < 0) return "Current expenditure must be a valid non-negative number.";
      if (!Number.isFinite(expected) || expected < 0 || expected > 100) return "Expected progress must be between 0 and 100.";
    }

    if (stepIndex === 3) {
      for (const item of form.evidence) {
        const parsedConfidence = Number(item.confidence);
        if (!Number.isFinite(parsedConfidence) || parsedConfidence < 0 || parsedConfidence > 100) {
          return `Evidence "${item.file?.name || item.sourceName || "link"}" needs a confidence value between 0 and 100.`;
        }
        if (!item.file) {
          if (!item.reference.trim()) return "Every link evidence item needs a URL.";
          if (!isHttpUrl(item.reference.trim())) {
            return "Evidence links must use a valid http:// or https:// URL.";
          }
        }
      }
    }

    if (stepIndex === 2) {
      if (!form.objectives.length) return "Add at least one objective.";
      for (const objective of form.objectives) {
        if (!objective.title.trim()) return "Every objective needs a title.";
        if (!Number.isFinite(Number(objective.weight)) || Number(objective.weight) <= 0) {
          return `Objective "${objective.title || "Untitled"}" needs a weight greater than 0.`;
        }
        if (!objective.metrics.length) return `Objective "${objective.title}" needs at least one metric.`;
        for (const metric of objective.metrics) {
          const baseline = Number(metric.baseline);
          const target = Number(metric.target);
          const current = Number(metric.current_value);
          const expected = metric.expected_value.trim() === "" ? null : Number(metric.expected_value);
          if (!metric.name.trim()) return "Every metric needs a name.";
          if (!Number.isFinite(baseline) || baseline < 0) return `Metric "${metric.name}" needs a valid baseline.`;
          if (!Number.isFinite(target) || target <= baseline) return `Metric "${metric.name}" needs a target greater than its baseline.`;
          if (!Number.isFinite(current) || current < 0) return `Metric "${metric.name}" needs a valid current value.`;
          if (expected !== null && (!Number.isFinite(expected) || expected < 0)) return `Metric "${metric.name}" has an invalid expected value.`;
          if (!Number.isFinite(Number(metric.weight)) || Number(metric.weight) <= 0) return `Metric "${metric.name}" needs a weight greater than 0.`;
        }
      }
    }

    return "";
  }

  function handleNext() {
    const message = validateStep(step);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError("");
    setStep((current) => Math.min(4, current + 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateStep(0) || validateStep(2) || validateStep(3);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError("");
    await onSubmit(form);
  }

  const inputClass =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/40 focus:bg-white/[0.04]";
  const labelClass =
    "mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500";

  const steps = ["Project details", "Project type", "Objectives & metrics", "Evidence", "Review"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/[0.09] bg-[#080d1a] shadow-2xl shadow-black/50">
        <div className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#080d1a]/95 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                  <Layers3 size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Create a government project</h3>
                  <p className="mt-0.5 text-[10px] text-slate-600">
                    Define outcomes and measurable targets instead of assuming every project is construction.
                  </p>
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={loading} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white">
              <X size={17} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (loading) return;
                  if (index <= step) {
                    setStepError("");
                    setStep(index);
                    return;
                  }
                  if (index === step + 1) handleNext();
                }}
                className={`rounded-xl border px-3 py-2 text-left ${
                  step === index
                    ? "border-cyan-400/25 bg-cyan-400/[0.07]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <p className={`text-[8px] font-bold uppercase tracking-wider ${step === index ? "text-cyan-300" : "text-slate-600"}`}>
                  0{index + 1}
                </p>
                <p className="mt-1 text-[9px] font-semibold text-slate-300">{label}</p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6">
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-[10px] leading-relaxed text-red-300">
              {error}
            </div>
          )}

          {stepError && (
            <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-[10px] leading-relaxed text-amber-300">
              {stepError}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>Project name *</label>
                  <input required value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Rural Drinking Water Coverage Programme" className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Description / intended outcome</label>
                  <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="What public outcome is this project trying to deliver?" rows={3} className={inputClass} />
                </div>
                {[
                  ["sector", "Sector", "Water, Education, Energy..."],
                  ["state", "State", "Telangana"],
                  ["location", "Location / coverage area", "Hyderabad / district / statewide"],
                  ["approved_cost", "Approved budget (Cr)", "1000"],
                  ["current_expenditure", "Current expenditure (Cr)", "250"],
                  ["expected_progress", "Expected overall progress (%)", "40"],
                ].map(([key, label, placeholder]) => (
                  <div key={key}>
                    <label className={labelClass}>{label}{["sector","state","location"].includes(key) ? " *" : ""}</label>
                    <input
                      required={["sector","state","location"].includes(key)}
                      type={["approved_cost","current_expenditure","expected_progress"].includes(key) ? "number" : "text"}
                      min={["approved_cost","current_expenditure","expected_progress"].includes(key) ? "0" : undefined}
                      max={key === "expected_progress" ? "100" : undefined}
                      step={["approved_cost","current_expenditure","expected_progress"].includes(key) ? "0.1" : undefined}
                      value={String(form[key as keyof CreateProjectForm] ?? "")}
                      onChange={(e) => updateField(key as keyof CreateProjectForm, e.target.value)}
                      placeholder={placeholder}
                      className={inputClass}
                    />
                  </div>
                ))}
                <div>
                  <label className={labelClass}>Start date</label>
                  <input type="date" value={form.start_date} onChange={(e) => updateField("start_date", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Target date</label>
                  <input type="date" value={form.target_date} onChange={(e) => updateField("target_date", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={form.status} onChange={(e) => updateField("status", e.target.value)} className={inputClass}>
                    <option value="In Progress">In Progress</option>
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-5">
                <p className="text-sm font-semibold">What kind of government project is this?</p>
                <p className="mt-1 text-[10px] text-slate-600">This only changes the suggested measurements. You can edit everything.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PROJECT_TYPE_OPTIONS.map(([value, description]) => {
                  const active = form.project_type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => changeType(value)}
                      className={`pv-interactive rounded-2xl border p-4 text-left ${
                        active ? "border-cyan-400/30 bg-cyan-400/[0.07] shadow-[0_0_30px_rgba(34,211,238,.06)]" : "border-white/[0.07] bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-cyan-400/15 text-cyan-300" : "bg-white/[0.04] text-slate-500"}`}>
                          <Target size={15} />
                        </span>
                        {active && <CheckCircle2 size={15} className="text-cyan-300" />}
                      </div>
                      <p className="mt-3 text-xs font-semibold">{value}</p>
                      <p className="mt-1 text-[9px] leading-relaxed text-slate-600">{description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold">Define objectives and measurable targets</p>
                  <p className="mt-1 text-[10px] text-slate-600">
                    Overall progress is calculated from these metrics. Example: 7,500 of 10,000 households = 75%.
                  </p>
                </div>
                <button type="button" onClick={addObjective} className="rounded-xl border border-blue-400/15 bg-blue-400/[0.05] px-3 py-2 text-[9px] font-semibold text-blue-300 hover:bg-blue-400/[0.09]">
                  + Add objective
                </button>
              </div>

              {form.objectives.map((objective, objectiveIndex) => (
                <div key={objectiveIndex} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                    <div>
                      <label className={labelClass}>Objective</label>
                      <input value={objective.title} onChange={(e) => updateObjective(objectiveIndex, { title: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Objective weight</label>
                      <input type="number" min="1" value={objective.weight} onChange={(e) => updateObjective(objectiveIndex, { weight: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <input value={objective.description} onChange={(e) => updateObjective(objectiveIndex, { description: e.target.value })} placeholder="Optional: what does success look like?" className={inputClass} />
                  </div>

                  <div className="mt-4 space-y-3">
                    {objective.metrics.map((metric, metricIndex) => (
                      <div key={metricIndex} className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">Metric {metricIndex + 1}</span>
                          {objective.metrics.length > 1 && (
                            <button type="button" onClick={() => removeMetric(objectiveIndex, metricIndex)} className="text-[9px] text-red-400 hover:text-red-300">Remove</button>
                          )}
                        </div>
                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="md:col-span-2">
                            <label className={labelClass}>Metric name *</label>
                            <input required value={metric.name} onChange={(e) => updateMetric(objectiveIndex, metricIndex, { name: e.target.value })} placeholder="e.g. Households connected" className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Measurement</label>
                            <select value={metric.kind} onChange={(e) => updateMetric(objectiveIndex, metricIndex, { kind: e.target.value })} className={inputClass}>
                              {["quantity","count","beneficiaries","percentage","area","capacity","milestone","currency","custom"].map((kind) => <option key={kind}>{kind}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Unit</label>
                            <input value={metric.unit} onChange={(e) => updateMetric(objectiveIndex, metricIndex, { unit: e.target.value })} placeholder="houses / people / %" className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Baseline</label>
                            <input type="number" value={metric.baseline} onChange={(e) => updateMetric(objectiveIndex, metricIndex, { baseline: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Target *</label>
                            <input required type="number" min="0.01" value={metric.target} onChange={(e) => updateMetric(objectiveIndex, metricIndex, { target: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Current value</label>
                            <input type="number" value={metric.current_value} onChange={(e) => updateMetric(objectiveIndex, metricIndex, { current_value: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Expected value</label>
                            <input type="number" value={metric.expected_value} onChange={(e) => updateMetric(objectiveIndex, metricIndex, { expected_value: e.target.value })} placeholder="Optional" className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Metric weight</label>
                            <input type="number" min="1" value={metric.weight} onChange={(e) => updateMetric(objectiveIndex, metricIndex, { weight: e.target.value })} className={inputClass} />
                          </div>
                        </div>
                        <label className="mt-3 flex items-center gap-2 text-[9px] text-slate-500">
                          <input type="checkbox" checked={metric.evidence_required} onChange={(e) => updateMetric(objectiveIndex, metricIndex, { evidence_required: e.target.checked })} />
                          Evidence required for this metric
                        </label>
                      </div>
                    ))}
                    <button type="button" onClick={() => addMetric(objectiveIndex)} className="rounded-lg border border-dashed border-white/[0.08] px-3 py-2 text-[9px] text-slate-500 hover:border-cyan-400/20 hover:text-cyan-300">
                      + Add metric
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.035] p-5">
                <div className="flex items-start gap-3">
                  <Database className="mt-0.5 text-cyan-300" size={17} />
                  <div>
                    <p className="text-xs font-semibold">Attach project evidence</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                      Add evidence either directly from your device or by pasting the source URL. You can attach it to a specific metric or keep it at project level.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] px-4 py-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.035]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300"><Upload size={17} /></div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-200">Upload from device</p>
                    <p className="mt-1 text-[8px] text-slate-600">PDF, CSV, Excel, Word, images, text and other files</p>
                  </div>
                  <input type="file" multiple className="hidden" onChange={(event) => { addEvidenceFiles(event.target.files); event.currentTarget.value = ""; }} />
                </label>

                <button
                  type="button"
                  onClick={addEvidenceLink}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] px-4 py-4 text-left transition hover:border-blue-400/30 hover:bg-blue-400/[0.035]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10 text-blue-300"><Globe2 size={17} /></div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-200">Add evidence link</p>
                    <p className="mt-1 text-[8px] text-slate-600">Paste an http:// or https:// source</p>
                  </div>
                </button>
              </div>

              {form.evidence.length > 0 && (
                <div className="space-y-3">
                  {form.evidence.map((item, index) => (
                    <div key={`${item.file?.name || item.reference || "evidence"}-${index}`} className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                            {item.file ? <FileText size={15} /> : <Globe2 size={15} />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[10px] font-semibold text-slate-200">
                              {item.file?.name || item.sourceName || "Evidence link"}
                            </p>
                            <p className="mt-1 text-[8px] text-slate-600">
                              {item.file ? `${(item.file.size / 1024 / 1024).toFixed(2)} MB · device file` : "Source link"}
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeEvidence(index)} className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-300"><X size={13} /></button>
                      </div>

                      {!item.file && (
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className={labelClass}>Source name</label>
                            <input value={item.sourceName} onChange={(event) => updateEvidence(index, { sourceName: event.target.value })} placeholder="Government portal / report name" className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Evidence URL *</label>
                            <input type="url" value={item.reference} onChange={(event) => updateEvidence(index, { reference: event.target.value })} placeholder="https://example.gov.in/report" className={inputClass} />
                          </div>
                        </div>
                      )}

                      <div className="mt-3 grid gap-3 md:grid-cols-4">
                        <div>
                          <label className={labelClass}>Attach to metric</label>
                          <select value={item.metricKey} onChange={(event) => updateEvidence(index, { metricKey: event.target.value })} className={inputClass}>
                            <option value="">Project-level evidence</option>
                            {form.objectives.flatMap((objective, objectiveIndex) => objective.metrics.map((metric, metricIndex) => ({ metric, key: `${objectiveIndex}:${metricIndex}` }))).map(({ metric, key }) => (
                              <option key={key} value={key}>{metric.name} · {metric.unit || "units"}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Evidence type</label>
                          <select value={item.evidenceType} onChange={(event) => updateEvidence(index, { evidenceType: event.target.value })} className={inputClass}>
                            {['manual','csv','excel','api','report','document','field_update','survey'].map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Evidence date</label>
                          <input type="date" value={item.observedAt} onChange={(event) => updateEvidence(index, { observedAt: event.target.value })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Confidence (%)</label>
                          <input type="number" min="0" max="100" value={item.confidence} onChange={(event) => updateEvidence(index, { confidence: event.target.value })} className={inputClass} />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className={labelClass}>Notes</label>
                        <textarea value={item.notes} onChange={(event) => updateEvidence(index, { notes: event.target.value })} rows={2} placeholder="What does this evidence establish?" className={inputClass} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {form.evidence.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/[0.07] p-5 text-center text-[9px] text-slate-600">
                  No evidence attached yet. You can skip this step and add evidence after the project is created.
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.035] p-5">
                <div className="flex items-start gap-3">
                  <Database className="mt-0.5 text-cyan-300" size={17} />
                  <div>
                    <p className="text-xs font-semibold">Universal measurement model</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                      AIPA will calculate progress from your objectives and metrics, then use that progress with expenditure to produce the existing risk and early-warning signals.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <DetailStat label="Project type" value={form.project_type} />
                <DetailStat label="Objectives" value={String(form.objectives.length)} />
                <DetailStat label="Metrics" value={String(form.objectives.reduce((sum, objective) => sum + objective.metrics.length, 0))} />
                <DetailStat label="Evidence files" value={String(form.evidence.length)} />
              </div>
              <div className="space-y-2">
                {form.objectives.map((objective, index) => (
                  <div key={index} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{objective.title}</span>
                      <span className="text-[9px] text-cyan-300">{objective.weight}% weight</span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {objective.metrics.map((metric, metricIndex) => (
                        <div key={metricIndex} className="rounded-lg border border-white/[0.05] bg-black/10 p-3">
                          <p className="text-[10px] font-medium">{metric.name}</p>
                          <p className="mt-1 text-[9px] text-slate-600">
                            Target: {metric.target || "—"} {metric.unit} · Current: {metric.current_value || "0"} {metric.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white disabled:opacity-40">
              Cancel
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep((current) => current - 1)} disabled={loading} className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs text-slate-400 hover:text-white">
                  Back
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={handleNext} disabled={loading} className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={loading || !form.name.trim() || !form.state.trim() || !form.location.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Creating...</> : <><Plus size={14} /> Create Project</>}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function PortfolioCount({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[8px] uppercase tracking-wider text-slate-600">{label}</p>
      <p className={`mt-1 text-lg font-bold ${danger ? "text-orange-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function RiskAnalysisView({
  projects,
  loading,
  onOpenProject,
  onBack,
}: {
  projects: Project[];
  loading: boolean;
  onOpenProject: (project: Project) => void;
  onBack: () => void;
}) {
  const riskCounts: Record<RiskLevel, number> = {
    Critical: projects.filter((project) => project.riskLevel === "Critical").length,
    High: projects.filter((project) => project.riskLevel === "High").length,
    Medium: projects.filter((project) => project.riskLevel === "Medium").length,
    Low: projects.filter((project) => project.riskLevel === "Low").length,
  };

  const averageRisk = projects.length
    ? projects.reduce((sum, project) => sum + project.risk, 0) / projects.length
    : 0;

  const averageGap = projects.length
    ? projects.reduce((sum, project) => sum + Math.max(0, project.expected - project.progress), 0) /
      projects.length
    : 0;

  const delayedProjects = projects.filter(
    (project) => project.progress < project.expected
  ).length;

  const rankedProjects = [...projects].sort((a, b) => b.risk - a.risk);

  return (
    <section>
      <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-4 text-[10px] font-semibold text-blue-400 transition hover:text-blue-300"
          >
            ← Back to Overview
          </button>

          <div className="mb-3 flex items-center gap-2 text-[10px] font-medium text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,.8)]" />
            AUTOMATIC RISK ENGINE
          </div>

          <h2 className="text-3xl font-bold tracking-[-0.04em] md:text-4xl">
            Risk{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Intelligence
            </span>
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Live risk scores calculated from project progress, expected progress,
            expenditure, and approved cost.
          </p>
        </div>

        <div className="rounded-xl border border-blue-400/10 bg-blue-500/[0.05] px-4 py-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-600">
            Engine status
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" />
            <span className="text-[10px] font-semibold text-emerald-300">
              {loading ? "Calculating..." : "Live calculations"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={<ShieldAlert size={17} />}
          title="Portfolio Risk"
          value={loading ? "—" : `${Math.round(averageRisk)}/100`}
          detail="Average project risk score"
          change="LIVE"
          gradient="red"
        />
        <Kpi
          icon={<AlertTriangle size={17} />}
          title="Critical + High"
          value={loading ? "—" : String(riskCounts.Critical + riskCounts.High)}
          detail="Projects requiring attention"
          change="LIVE"
          gradient="red"
        />
        <Kpi
          icon={<Clock3 size={17} />}
          title="Delayed Projects"
          value={loading ? "—" : String(delayedProjects)}
          detail={`${averageGap.toFixed(1)}% average schedule gap`}
          change="LIVE"
          gradient="amber"
        />
        <Kpi
          icon={<Activity size={17} />}
          title="Projects Monitored"
          value={loading ? "—" : String(projects.length)}
          detail="Using automatic risk scoring"
          change="LIVE"
          positive
          gradient="blue"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-card pv-interactive overflow-hidden">
                <span className="pv-sweep" />
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-sm font-semibold">Risk Distribution</h3>
            <p className="mt-1 text-[10px] text-slate-600">
              Current portfolio classification
            </p>
          </div>

          <div className="space-y-3 p-5">
            {(["Critical", "High", "Medium", "Low"] as RiskLevel[]).map((level) => {
              const count = riskCounts[level];
              const percent = projects.length ? (count / projects.length) * 100 : 0;

              const barClass: Record<RiskLevel, string> = {
                Critical: "bg-red-400",
                High: "bg-orange-400",
                Medium: "bg-amber-400",
                Low: "bg-emerald-400",
              };

              return (
                <div key={level}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <RiskBadge level={level} />
                    <span className="text-[9px] text-slate-500">
                      {count} project{count === 1 ? "" : "s"} · {percent.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className={`h-full rounded-full transition-all ${barClass[level]}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/[0.06] p-5">
            <div className="flex items-start gap-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                <Sparkles size={14} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-cyan-200">
                  How the engine works
                </p>
                <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                  The backend compares actual physical progress with expected
                  progress and compares expenditure with physical progress.
                  Those indicators are combined into the stored project risk score.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card pv-interactive overflow-hidden">
                <span className="pv-sweep" />
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold">Project Risk Ranking</h3>
              <p className="mt-1 text-[10px] text-slate-600">
                Highest calculated risk appears first
              </p>
            </div>

            <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[8px] font-bold text-blue-300">
              {projects.length} LIVE
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/[0.05] text-left text-[8px] uppercase tracking-[0.14em] text-slate-600">
                  <th className="px-5 py-3 font-semibold">Project</th>
                  <th className="px-3 py-3 font-semibold">Progress Gap</th>
                  <th className="px-3 py-3 font-semibold">Cost Use</th>
                  <th className="px-3 py-3 font-semibold">Risk</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-600">
                      Calculating risk intelligence…
                    </td>
                  </tr>
                ) : rankedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-600">
                      No projects available for risk analysis.
                    </td>
                  </tr>
                ) : (
                  rankedProjects.map((project) => {
                    const progressGap = project.expected - project.progress;
                    const spendPercent =
                      project.approvedCost > 0
                        ? (project.currentExpenditure / project.approvedCost) * 100
                        : 0;

                    return (
                      <tr
                        key={project.id}
                        className="border-b border-white/[0.04] transition hover:bg-blue-500/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => onOpenProject(project)}
                            className="text-left"
                          >
                            <p className="max-w-[210px] truncate text-xs font-semibold hover:text-blue-300">
                              {project.name}
                            </p>
                            <p className="mt-1 text-[9px] text-slate-600">
                              {project.id} · {project.state}
                            </p>
                          </button>
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                progressGap > 0
                                  ? "text-[10px] font-semibold text-orange-400"
                                  : "text-[10px] font-semibold text-emerald-400"
                              }
                            >
                              {progressGap > 0 ? `-${progressGap.toFixed(1)}%` : `+${Math.abs(progressGap).toFixed(1)}%`}
                            </span>
                            <span className="text-[8px] text-slate-700">
                              actual {project.progress}%
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <div>
                            <p className="text-[10px] font-semibold">
                              {spendPercent.toFixed(1)}%
                            </p>
                            <p className="mt-1 text-[8px] text-slate-700">
                              physical {project.progress}%
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${riskDotClass(project.risk)}`}
                            />
                            <span className="text-sm font-bold">
                              {Math.round(project.risk)}
                            </span>
                            <RiskBadge level={project.riskLevel} />
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenProject(project)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-400/10 bg-blue-500/[0.06] px-2.5 py-1.5 text-[9px] font-semibold text-blue-400 transition hover:border-blue-400/25 hover:bg-blue-500/10 hover:text-blue-300"
                          >
                            Investigate
                            <ChevronRight size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="glass-card pv-interactive p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Schedule signal
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold">{delayedProjects}</p>
              <p className="mt-1 text-[9px] text-slate-600">
                projects below expected progress
              </p>
            </div>
            <Clock3 size={22} className="text-amber-400" />
          </div>
        </div>

        <div className="glass-card pv-interactive p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Cost signal
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold">
                {projects.filter((project) => {
                  if (!project.approvedCost) return false;
                  const spendPercent =
                    (project.currentExpenditure / project.approvedCost) * 100;
                  return spendPercent > project.progress + 10;
                }).length}
              </p>
              <p className="mt-1 text-[9px] text-slate-600">
                projects spending ahead of progress
              </p>
            </div>
            <CircleDollarSign size={22} className="text-cyan-400" />
          </div>
        </div>

        <div className="glass-card pv-interactive p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Highest current risk
          </p>
          {rankedProjects[0] ? (
            <button
              type="button"
              onClick={() => onOpenProject(rankedProjects[0])}
              className="mt-3 flex w-full items-center justify-between text-left"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">
                  {rankedProjects[0].id}
                </p>
                <p className="mt-1 truncate text-[9px] text-slate-600">
                  {rankedProjects[0].name}
                </p>
              </div>
              <div className="ml-3 flex items-center gap-2">
                <span className="text-xl font-bold">
                  {Math.round(rankedProjects[0].risk)}
                </span>
                <ChevronRight size={14} className="text-slate-600" />
              </div>
            </button>
          ) : (
            <p className="mt-3 text-xs text-slate-600">No projects available.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function ProjectDetailsModal({
  project,
  alerts,
  loading,
  deleting,
  error,
  onDelete,
  onProjectUpdated,
  onClose,
}: {
  project: Project;
  alerts: AlertItem[];
  loading: boolean;
  deleting: boolean;
  error: string;
  onDelete: (projectId: string) => Promise<void>;
  onProjectUpdated: (project: Project) => void;
  onClose: () => void;
}) {
  const progressGap = project.expected - project.progress;
  const spendPercent = project.approvedCost > 0
    ? (project.currentExpenditure / project.approvedCost) * 100
    : 0;

  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(true);
  const [evidenceError, setEvidenceError] = useState("");
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [savingEvidence, setSavingEvidence] = useState(false);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null);
  const [evidenceMetricId, setEvidenceMetricId] = useState("");
  const [evidenceType, setEvidenceType] = useState("manual");
  const [sourceName, setSourceName] = useState("");
  const [reference, setReference] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceObservedAt, setEvidenceObservedAt] = useState("");
  const [extractedValue, setExtractedValue] = useState("");
  const [confidence, setConfidence] = useState("80");
  const [notes, setNotes] = useState("");
  const [extractingEvidenceId, setExtractingEvidenceId] = useState<string | null>(null);
  const [extractionResults, setExtractionResults] = useState<Record<string, EvidenceCandidate[]>>({});
  const [recommendationResults, setRecommendationResults] = useState<Record<string, EvidenceRecommendation | null>>({});
  const [extractionMessages, setExtractionMessages] = useState<Record<string, string>>({});
  const [consistencyInsights, setConsistencyInsights] = useState<EvidenceConsistencyInsight[]>([]);
  const [consistencySummary, setConsistencySummary] = useState("");
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [intelligence, setIntelligence] = useState<ProjectIntelligence | null>(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [metricHistory, setMetricHistory] = useState<MetricHistory[]>([]);
  const [metricHistoryLoading, setMetricHistoryLoading] = useState(false);
  const [intelligenceError, setIntelligenceError] = useState("");

  const allMetrics = project.objectives.flatMap((objective) => objective.metrics);

  const normalizeEvidence = (item: any): EvidenceItem => ({
    id: item.id,
    projectId: String(item.project_id ?? project.id),
    metricId: item.metric_id ?? null,
    metricName: item.metric_name ?? null,
    evidenceType: String(item.evidence_type ?? "manual"),
    sourceName: String(item.source_name ?? item.title ?? ""),
    reference: String(item.reference ?? item.source_reference ?? ""),
    extractedValue: item.extracted_value == null ? null : toNumber(item.extracted_value),
    confidence: toNumber(item.confidence),
    notes: String(item.notes ?? ""),
    createdAt: item.created_at ?? null,
    observedAt: item.observed_at ?? null,
    appliedAt: item.applied_at ?? null,
    isCurrent: Boolean(item.is_current),
  });

  const loadEvidence = useCallback(async () => {
    setEvidenceLoading(true);
    setEvidenceError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/evidence`,
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.detail
            ? typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
            : `Evidence API returned ${response.status}`
        );
      }
      setEvidence(
        Array.isArray(data?.evidence) ? data.evidence.map(normalizeEvidence) : []
      );
    } catch (err) {
      setEvidenceError(err instanceof Error ? err.message : "Unable to load evidence.");
    } finally {
      setEvidenceLoading(false);
    }
  }, [project.id]);

  const loadConsistency = useCallback(async () => {
    setConsistencyLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/evidence/consistency`, { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || `Evidence consistency API returned ${response.status}`);
      setConsistencyInsights(Array.isArray(data?.insights) ? data.insights.map((item: any) => ({
        metricId: item.metric_id, metricName: String(item.metric_name ?? "Metric"), unit: String(item.unit ?? ""),
        status: item.status === "conflict" || item.status === "watch" ? item.status : "consistent",
        message: String(item.message ?? ""), sourceCount: toNumber(item.source_count), minimum: toNumber(item.minimum),
        maximum: toNumber(item.maximum), average: toNumber(item.average), spreadPercent: toNumber(item.spread_percent),
        currentValue: toNumber(item.current_value), sources: Array.isArray(item.sources) ? item.sources.map((source: any) => ({
          evidenceId: source.evidence_id, sourceName: String(source.source_name ?? "Evidence"), reference: String(source.reference ?? ""),
          value: toNumber(source.value), confidence: toNumber(source.confidence), createdAt: source.created_at ?? null,
        })) : [],
      })) : []);
      setConsistencySummary(String(data?.summary ?? ""));
    } catch (err) {
      setConsistencyInsights([]);
      setConsistencySummary(err instanceof Error ? err.message : "Unable to check evidence consistency.");
    } finally {
      setConsistencyLoading(false);
    }
  }, [project.id]);

  const loadIntelligence = useCallback(async () => {
    setIntelligenceLoading(true);
    setIntelligenceError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/intelligence`,
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || `Project intelligence API returned ${response.status}`);

      setIntelligence({
        attentionLevel: getRiskLevelFromBackend(data?.attention_level, 0),
        summary: String(data?.summary ?? ""),
        overallProgress: toNumber(data?.overall_progress),
        expectedProgress: toNumber(data?.expected_progress),
        progressGap: toNumber(data?.progress_gap),
        riskScore: toNumber(data?.risk_score),
        measurementConfidence: data?.measurement_confidence == null ? null : toNumber(data.measurement_confidence),
        evidenceConflicts: toNumber(data?.evidence_conflicts),
        signalCount: toNumber(data?.signal_count),
        signals: Array.isArray(data?.signals) ? data.signals.map((signal: any) => ({
          id: String(signal.id ?? "signal"),
          code: String(signal.code ?? "SIGNAL"),
          level: getRiskLevelFromBackend(signal.level, 0),
          title: String(signal.title ?? "Project signal"),
          message: String(signal.message ?? ""),
          metricId: signal.metric_id ?? null,
          value: signal.value == null ? null : toNumber(signal.value),
          threshold: signal.threshold == null ? null : toNumber(signal.threshold),
          recommendedAction: String(signal.recommended_action ?? ""),
        })) : [],
        drivers: Array.isArray(data?.drivers) ? data.drivers.map((driver: any) => ({
          code: String(driver.code ?? "DRIVER"),
          level: getRiskLevelFromBackend(driver.level, 0),
          title: String(driver.title ?? "Driver"),
          message: String(driver.message ?? ""),
          metricId: driver.metric_id ?? null,
        })) : [],
        recommendedActions: Array.isArray(data?.recommended_actions) ? data.recommended_actions.map(String) : [],
        explainability: data?.explainability ? {
          method: String(data.explainability.method ?? ""),
          inputs: Array.isArray(data.explainability.inputs) ? data.explainability.inputs.map(String) : [],
          dataChanged: Boolean(data.explainability.data_changed),
        } : undefined,
      });
    } catch (err) {
      setIntelligence(null);
      setIntelligenceError(err instanceof Error ? err.message : "Unable to load project intelligence.");
    } finally {
      setIntelligenceLoading(false);
    }
  }, [project.id]);

  const loadMetricHistory = useCallback(async () => {
    setMetricHistoryLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/metrics/history`,
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.detail || `Metric history API returned ${response.status}`);
      }

      setMetricHistory(
        Array.isArray(data?.metrics)
          ? data.metrics.map((item: any) => ({
              metricId: item.metric_id,
              metricName: String(item.metric_name ?? "Metric"),
              unit: String(item.unit ?? ""),
              baseline: toNumber(item.baseline),
              target: toNumber(item.target),
              currentValue: toNumber(item.current_value),
              progress: toNumber(item.progress),
              trend: String(item.trend ?? "insufficient data"),
              observationCount: toNumber(item.observation_count),
              observations: Array.isArray(item.observations)
                ? item.observations.map((point: any) => ({
                    evidenceId: String(point.evidence_id ?? ""),
                    observedAt: String(point.observed_at ?? ""),
                    value: toNumber(point.value),
                    confidence: toNumber(point.confidence),
                    sourceName: String(point.source_name ?? "Evidence"),
                    reference: String(point.reference ?? ""),
                    isCurrent: Boolean(point.is_current),
                  }))
                : [],
              latestObservedAt: item.latest_observed_at ?? null,
              previousValue: item.previous_value == null ? null : toNumber(item.previous_value),
              delta: item.delta == null ? null : toNumber(item.delta),
              deltaPercent: item.delta_percent == null ? null : toNumber(item.delta_percent),
              daysBetween: item.days_between == null ? null : toNumber(item.days_between),
              ratePerDay: item.rate_per_day == null ? null : toNumber(item.rate_per_day),
              overallRatePerDay: item.overall_rate_per_day == null ? null : toNumber(item.overall_rate_per_day),
              requiredRatePerDay: item.required_rate_per_day == null ? null : toNumber(item.required_rate_per_day),
              targetRemaining: toNumber(item.target_remaining),
              daysToTarget: item.days_to_target == null ? null : toNumber(item.days_to_target),
              paceRatio: item.pace_ratio == null ? null : toNumber(item.pace_ratio),
              paceStatus: String(item.pace_status ?? "insufficient data"),
            }))
          : []
      );
    } catch (err) {
      console.warn("Metric history API error:", err);
      setMetricHistory([]);
    } finally {
      setMetricHistoryLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    void loadEvidence();
    void loadConsistency();
    void loadIntelligence();
    void loadMetricHistory();
  }, [loadEvidence, loadConsistency, loadIntelligence, loadMetricHistory]);

  function openEvidenceForm(metricId?: string | number) {
    setEvidenceMetricId(metricId == null ? "" : String(metricId));
    setEvidenceError("");
    setShowEvidenceForm(true);
  }

  function resetEvidenceForm() {
    setEvidenceMetricId("");
    setEvidenceType("manual");
    setSourceName("");
    setReference("");
    setEvidenceFile(null);
    setEvidenceObservedAt("");
    setExtractedValue("");
    setConfidence("80");
    setNotes("");
  }

  async function saveEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingEvidence(true);
    setEvidenceError("");

    try {
      const parsedValue = extractedValue.trim() === "" ? null : Number(extractedValue);
      const parsedConfidence = Number(confidence);

      if (parsedValue !== null && (!Number.isFinite(parsedValue) || parsedValue < 0)) {
        throw new Error("Extracted value must be a valid non-negative number.");
      }
      if (!Number.isFinite(parsedConfidence) || parsedConfidence < 0 || parsedConfidence > 100) {
        throw new Error("Confidence must be between 0 and 100.");
      }

      if (evidenceFile) {
        const body = new FormData();
        body.append("file", evidenceFile);
        if (evidenceMetricId) body.append("metric_id", evidenceMetricId);
        body.append("evidence_type", evidenceType);
        if (evidenceObservedAt) body.append("observed_at", evidenceObservedAt);
        body.append("confidence", String(parsedConfidence));
        if (parsedValue !== null) body.append("extracted_value", String(parsedValue));
        body.append("notes", notes.trim());

        const response = await fetch(
          `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/evidence/upload`,
          { method: "POST", body }
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.detail
              ? typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
              : data?.error || `Evidence upload failed with status ${response.status}.`
          );
        }

        onProjectUpdated(normalizeProject(data?.project ?? project));
      } else {
        if (!sourceName.trim()) {
          throw new Error("Source name is required for link/manual evidence.");
        }
        if (reference.trim() && !isHttpUrl(reference.trim())) {
          throw new Error("Reference must be a valid http:// or https:// URL.");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/evidence`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              metric_id: evidenceMetricId || null,
              evidence_type: evidenceType,
              observed_at: evidenceObservedAt || null,
              source_name: sourceName.trim(),
              reference: reference.trim(),
              extracted_value: parsedValue,
              confidence: parsedConfidence,
              notes: notes.trim(),
            }),
          }
        );

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            data?.detail
              ? typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
              : data?.error || `Evidence save failed with status ${response.status}.`
          );
        }

        onProjectUpdated(normalizeProject(data?.project ?? project));
      }

      await loadEvidence();
      await loadConsistency();
      await loadMetricHistory();
      await loadIntelligence();
      resetEvidenceForm();
      setShowEvidenceForm(false);
    } catch (err) {
      setEvidenceError(err instanceof Error ? err.message : "Unable to save evidence.");
    } finally {
      setSavingEvidence(false);
    }
  }

  async function recommendEvidence(evidenceId: string) {
    setExtractingEvidenceId(evidenceId);
    setEvidenceError("");
    setExtractionMessages((current) => ({ ...current, [evidenceId]: "" }));

    try {
      const item = evidence.find((entry) => String(entry.id) === evidenceId);
      if (!item) throw new Error("Evidence record not found.");

      if (!item.reference.includes("/evidence/file/") && item.extractedValue == null) {
        throw new Error("Automatic recommendation needs an uploaded evidence file or an existing extracted value.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/evidence/${encodeURIComponent(evidenceId)}/recommend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail
            ? typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
            : data?.error || `Recommendation failed with status ${response.status}.`
        );
      }

      const raw = data?.recommendation;
      const recommendation: EvidenceRecommendation | null = raw
        ? {
            metricId: raw.metric_id,
            metricName: String(raw.metric_name ?? "Metric"),
            unit: String(raw.unit ?? ""),
            metricKind: String(raw.metric_kind ?? ""),
            recommendedValue: toNumber(raw.recommended_value),
            confidence: toNumber(raw.confidence),
            extractionConfidence: toNumber(raw.extraction_confidence),
            sourceConfidence: toNumber(raw.source_confidence),
            context: String(raw.context ?? ""),
            reasonCodes: Array.isArray(raw.reason_codes) ? raw.reason_codes.map(String) : [],
            explanation: String(raw.explanation ?? ""),
            consistencyAverage: raw.consistency_average == null ? null : toNumber(raw.consistency_average),
            consistencyDeviationPercent: raw.consistency_deviation_percent == null ? null : toNumber(raw.consistency_deviation_percent),
            selectionNote: raw.selection_note ? String(raw.selection_note) : undefined,
          }
        : null;

      setRecommendationResults((current) => ({
        ...current,
        [evidenceId]: recommendation,
      }));

      if (!recommendation) {
        setExtractionMessages((current) => ({
          ...current,
          [evidenceId]: String(data?.message ?? "No confident recommendation was found."),
        }));
      }
    } catch (err) {
      setRecommendationResults((current) => ({ ...current, [evidenceId]: null }));
      setExtractionMessages((current) => ({
        ...current,
        [evidenceId]: err instanceof Error ? err.message : "Unable to recommend a metric value.",
      }));
    } finally {
      setExtractingEvidenceId(null);
    }
  }

  async function applyRecommendation(evidenceId: string) {
    const item = evidence.find((entry) => String(entry.id) === evidenceId);
    const recommendation = recommendationResults[evidenceId];

    if (!item || !recommendation) {
      setExtractionMessages((current) => ({ ...current, [evidenceId]: "Recommendation is no longer available. Analyze it again." }));
      return;
    }

    setExtractingEvidenceId(evidenceId);
    setEvidenceError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/evidence/${encodeURIComponent(evidenceId)}/extract`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metric_id: String(recommendation.metricId),
            apply: true,
            selected_value: recommendation.recommendedValue,
          }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail
            ? typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
            : data?.error || `Apply failed with status ${response.status}.`
        );
      }

      onProjectUpdated(normalizeProject(data?.project ?? project));
      await loadEvidence();
      await loadConsistency();
      await loadIntelligence();

      setExtractionMessages((current) => ({
        ...current,
        [evidenceId]: String(data?.message ?? `Reviewed ${recommendation.recommendedValue} for ${recommendation.metricName}.`),
      }));
    } catch (err) {
      setExtractionMessages((current) => ({
        ...current,
        [evidenceId]: err instanceof Error ? err.message : "Unable to apply recommendation.",
      }));
    } finally {
      setExtractingEvidenceId(null);
    }
  }

  async function analyzeEvidence(evidenceId: string, apply = false) {
    setExtractingEvidenceId(evidenceId);
    setEvidenceError("");
    setExtractionMessages((current) => ({ ...current, [evidenceId]: "" }));
    try {
      const item = evidence.find((entry) => String(entry.id) === evidenceId);
      if (!item) throw new Error("Evidence record not found.");
      if (!item.reference.includes("/evidence/file/")) {
        throw new Error("Automatic extraction is available for files uploaded from the device, not external links.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/evidence/${encodeURIComponent(evidenceId)}/extract`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metric_id: item.metricId ? String(item.metricId) : null, apply }),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.detail
            ? typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
            : data?.error || `Evidence analysis failed with status ${response.status}.`
        );
      }

      if (apply) {
        onProjectUpdated(normalizeProject(data?.project ?? project));
        await loadEvidence();
        await loadConsistency();
        await loadIntelligence();
        setExtractionMessages((current) => ({ ...current, [evidenceId]: "Value applied to the selected metric and progress recalculated." }));
      } else {
        setExtractionResults((current) => ({
          ...current,
          [evidenceId]: Array.isArray(data?.candidates) ? data.candidates : [],
        }));
        setExtractionMessages((current) => ({
          ...current,
          [evidenceId]: data?.message || (data?.candidates?.length ? "Review the detected values before applying one." : "No numeric values were detected."),
        }));
      }
    } catch (err) {
      setExtractionMessages((current) => ({
        ...current,
        [evidenceId]: err instanceof Error ? err.message : "Unable to analyze evidence.",
      }));
    } finally {
      setExtractingEvidenceId(null);
    }
  }

  async function removeEvidence(evidenceId: string) {
    setDeletingEvidenceId(evidenceId);
    setEvidenceError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/evidence/${encodeURIComponent(evidenceId)}`,
        { method: "DELETE" }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.detail
            ? typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)
            : data?.error || `Evidence deletion failed with status ${response.status}.`
        );
      }
      const updatedProject = normalizeProject(data?.project ?? project);
      onProjectUpdated(updatedProject);
      setEvidence((current) => current.filter((item) => String(item.id) !== evidenceId));
      await loadConsistency();
      await loadIntelligence();
      await loadConsistency();
    } catch (err) {
      setEvidenceError(err instanceof Error ? err.message : "Unable to delete evidence.");
    } finally {
      setDeletingEvidenceId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/[0.09] bg-[#080d1a] shadow-2xl shadow-black/50">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/[0.07] bg-[#080d1a]/95 px-5 py-4 backdrop-blur-xl md:px-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-bold tracking-[0.15em] text-slate-600">{project.id}</span>
              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.05] px-2 py-1 text-[8px] font-bold text-cyan-300">{project.projectType}</span>
              <RiskBadge level={project.riskLevel} />
              {loading && <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[8px] font-semibold text-blue-300">Syncing…</span>}
            </div>
            <h3 className="text-lg font-bold tracking-tight md:text-xl">{project.name}</h3>
            <p className="mt-1 text-[10px] text-slate-500">{project.sector} · {project.location} · {project.status}</p>
          </div>
          <button type="button" onClick={onClose} className="ml-4 rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-5 p-5 md:p-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <DetailStat label="Overall progress" value={formatPercent(project.progress)} />
            <DetailStat label="Expected" value={formatPercent(project.expected)} />
            <DetailStat label="Risk score" value={`${Math.round(project.risk)}/100`} />
            <DetailStat label="Evidence confidence" value={project.measurementConfidence == null ? "No evidence" : `${Math.round(project.measurementConfidence)}%`} />
          </div>

          {project.description && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">Project outcome</p>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{project.description}</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="pv-interactive rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">Universal progress</p>
                <span className={progressGap > 0 ? "text-[9px] text-amber-400" : "text-[9px] text-emerald-400"}>
                  {progressGap > 0 ? `${progressGap.toFixed(1)}% behind` : "On / ahead of plan"}
                </span>
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[9px]"><span className="text-slate-500">Measured</span><span>{formatPercent(project.progress)}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${project.progress}%` }} /></div>
                <div className="mt-2 flex justify-between text-[9px] text-slate-600"><span>Expected</span><span>{formatPercent(project.expected)}</span></div>
              </div>
            </div>

            <div className="pv-interactive rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">Expenditure</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div><p className="text-lg font-bold">{formatCr(project.currentExpenditure)}</p><p className="mt-1 text-[9px] text-slate-600">of {formatCr(project.approvedCost)} approved</p></div>
                <p className="text-xs font-semibold text-cyan-300">{spendPercent.toFixed(1)}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className={`h-full rounded-full ${spendPercent > project.progress + 10 ? "bg-orange-400" : "bg-cyan-400"}`} style={{ width: `${Math.min(100, spendPercent)}%` }} /></div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Target size={15} className="text-cyan-300" />
              <div><h4 className="text-xs font-semibold">Objectives & measurable targets</h4><p className="mt-1 text-[9px] text-slate-600">Progress is calculated from weighted objectives and metrics.</p></div>
            </div>

            {project.objectives.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.08] p-5 text-center text-[10px] text-slate-600">No universal objectives have been configured for this project yet.</div>
            ) : (
              <div className="space-y-3">
                {project.objectives.map((objective) => (
                  <div key={objective.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-[11px] font-semibold">{objective.title}</p>{objective.description && <p className="mt-1 text-[9px] text-slate-600">{objective.description}</p>}</div>
                      <span className="shrink-0 rounded-full bg-cyan-400/10 px-2 py-1 text-[8px] font-bold text-cyan-300">{objective.weight}% weight</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {objective.metrics.map((metric) => (
                        <div key={metric.id} className="rounded-lg border border-white/[0.05] bg-black/10 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0"><p className="truncate text-[10px] font-medium">{metric.name}</p><p className="mt-1 text-[8px] text-slate-600">{metric.kind} · {metric.unit || "units"}</p></div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-[10px] font-semibold text-cyan-300">{metric.progress.toFixed(1)}%</span>
                              <button type="button" onClick={() => openEvidenceForm(metric.id)} className="inline-flex items-center gap-1 rounded-md border border-cyan-400/15 bg-cyan-400/[0.06] px-2 py-1 text-[8px] font-semibold text-cyan-300 hover:bg-cyan-400/10">
                                <Plus size={10} /> Evidence
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${metric.progress}%` }} /></div>
                          <div className="mt-2 flex flex-wrap justify-between gap-2 text-[8px] text-slate-600">
                            <span>Current: {metric.currentValue} {metric.unit}</span>
                            <span>Target: {metric.target} {metric.unit}</span>
                            <span>Weight: {metric.weight}%</span>
                            {metric.evidenceRequired && <span className="text-amber-400">Evidence required</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.035] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 text-cyan-300" size={15} />
                <div>
                  <p className="text-[10px] font-semibold text-cyan-200">Evidence layer</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-slate-500">Attach source evidence to a metric. Historical observations remain in the timeline; only the newest reviewed observation becomes the current metric value.</p>
                </div>
              </div>
              <button type="button" onClick={() => openEvidenceForm()} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-2 text-[9px] font-semibold text-cyan-300 hover:bg-cyan-400/10"><Plus size={12} /> Add Evidence</button>
            </div>

            {showEvidenceForm && (
              <form onSubmit={saveEvidence} className="mt-4 space-y-3 rounded-xl border border-white/[0.07] bg-black/15 p-4">
                <div className="flex items-center justify-between"><p className="text-[10px] font-semibold">Record evidence</p><button type="button" onClick={() => { setShowEvidenceForm(false); resetEvidenceForm(); }} className="text-slate-600 hover:text-white"><X size={13} /></button></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block"><span className="text-[8px] uppercase tracking-wider text-slate-600">Metric</span><select value={evidenceMetricId} onChange={(event) => setEvidenceMetricId(event.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b1220] px-3 py-2 text-[9px] text-slate-300 outline-none"><option value="">Project-level evidence</option>{allMetrics.map((metric) => <option key={metric.id} value={String(metric.id)}>{metric.name}</option>)}</select></label>
                  <label className="block"><span className="text-[8px] uppercase tracking-wider text-slate-600">Evidence type</span><select value={evidenceType} onChange={(event) => setEvidenceType(event.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b1220] px-3 py-2 text-[9px] text-slate-300 outline-none">{["manual","csv","excel","api","report","document","field_update","survey"].map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}</select></label>
                  <label className="block"><span className="text-[8px] uppercase tracking-wider text-slate-600">Source name</span><input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="Monthly progress report / portal name" className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b1220] px-3 py-2 text-[9px] text-slate-300 outline-none placeholder:text-slate-700" /></label>
                  <label className="block"><span className="text-[8px] uppercase tracking-wider text-slate-600">Reference / link</span><input type="url" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="https://example.gov.in/report" className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b1220] px-3 py-2 text-[9px] text-slate-300 outline-none placeholder:text-slate-700" /></label>
                  <label className="block"><span className="text-[8px] uppercase tracking-wider text-slate-600">Measured value (optional)</span><input type="number" min="0" step="any" value={extractedValue} onChange={(event) => setExtractedValue(event.target.value)} placeholder="Updates the selected metric" className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b1220] px-3 py-2 text-[9px] text-slate-300 outline-none placeholder:text-slate-700" /></label>
                  <label className="block"><span className="text-[8px] uppercase tracking-wider text-slate-600">Evidence date</span><input type="date" value={evidenceObservedAt} onChange={(event) => setEvidenceObservedAt(event.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b1220] px-3 py-2 text-[9px] text-slate-300 outline-none" /><span className="mt-1 block text-[7px] text-slate-700">Date described by the source, not upload date.</span></label>
                  <label className="block"><span className="text-[8px] uppercase tracking-wider text-slate-600">Confidence %</span><input type="number" min="0" max="100" value={confidence} onChange={(event) => setConfidence(event.target.value)} className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b1220] px-3 py-2 text-[9px] text-slate-300 outline-none" /></label>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-3">
                  <Upload size={14} className="text-cyan-300" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[9px] font-semibold text-slate-300">Upload directly from device</span>
                    <span className="mt-0.5 block truncate text-[8px] text-slate-600">{evidenceFile ? evidenceFile.name : "Choose a PDF, Excel, CSV, image, Word file or other evidence"}</span>
                  </span>
                  <input type="file" className="hidden" onChange={(event) => { setEvidenceFile(event.target.files?.[0] ?? null); if (event.target.files?.[0]) setSourceName(event.target.files[0].name); event.currentTarget.value = ""; }} />
                </label>
                <p className="text-[8px] text-slate-600">Use the URL field for a source link, or choose a device file. If both are provided, the device file is uploaded.</p>
                <label className="block"><span className="text-[8px] uppercase tracking-wider text-slate-600">Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="What does this evidence establish?" className="mt-1 w-full resize-none rounded-lg border border-white/[0.08] bg-[#0b1220] px-3 py-2 text-[9px] text-slate-300 outline-none placeholder:text-slate-700" /></label>
                {evidenceError && <p className="rounded-lg border border-red-500/15 bg-red-500/[0.05] px-3 py-2 text-[9px] text-red-300">{evidenceError}</p>}
                <div className="flex justify-end gap-2"><button type="button" onClick={() => { setShowEvidenceForm(false); resetEvidenceForm(); }} className="rounded-lg border border-white/[0.08] px-3 py-2 text-[9px] text-slate-500 hover:text-white">Cancel</button><button type="submit" disabled={savingEvidence} className="rounded-lg bg-cyan-400 px-3 py-2 text-[9px] font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">{savingEvidence ? "Saving..." : "Save Evidence"}</button></div>
              </form>
            )}

            {(consistencyInsights.length > 0 || consistencySummary) && (
              <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">Evidence consistency</p><p className="mt-1 text-[8px] text-slate-600">Compares extracted values from different evidence sources attached to the same metric.</p></div>
                  <button type="button" onClick={() => void loadConsistency()} disabled={consistencyLoading} className="rounded-md border border-white/[0.08] px-2.5 py-1.5 text-[8px] font-semibold text-slate-400 hover:text-white disabled:opacity-50">{consistencyLoading ? "Checking…" : "Check again"}</button>
                </div>
                {consistencySummary && <p className="mt-2 text-[8px] text-slate-500">{consistencySummary}</p>}
                {consistencyInsights.filter((item) => item.status !== "consistent").map((item) => (
                  <div key={String(item.metricId)} className={`mt-2 rounded-md border p-2.5 ${item.status === "conflict" ? "border-red-400/15 bg-red-400/[0.035]" : "border-amber-400/15 bg-amber-400/[0.035]"}`}>
                    <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-semibold text-slate-200">{item.metricName}</span><span className={`text-[7px] font-bold uppercase tracking-wider ${item.status === "conflict" ? "text-red-300" : "text-amber-300"}`}>{item.status}</span></div>
                    <p className="mt-1 text-[8px] leading-relaxed text-slate-500">{item.message}</p>
                    <p className="mt-1 text-[7px] text-slate-600">Sources: {item.sourceCount} · range: {item.minimum}–{item.maximum}{item.unit ? ` ${item.unit}` : ""} · current: {item.currentValue}{item.unit ? ` ${item.unit}` : ""}</p>
                  </div>
                ))}
                {consistencyInsights.length > 0 && consistencyInsights.every((item) => item.status === "consistent") && <p className="mt-2 rounded-md border border-emerald-400/10 bg-emerald-400/[0.03] px-2.5 py-2 text-[8px] text-emerald-300">No material discrepancy was detected between extracted evidence values.</p>}
              </div>
            )}

            <div className="mt-4 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.025] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300">Metric history & trend</p>
                  <p className="mt-1 text-[8px] text-slate-600">Evidence-backed observations over time. The latest reviewed observation is marked current; older observations remain historical.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadMetricHistory()}
                  disabled={metricHistoryLoading}
                  className="rounded-md border border-white/[0.08] px-2.5 py-1.5 text-[8px] font-semibold text-slate-400 hover:text-white disabled:opacity-50"
                >
                  {metricHistoryLoading ? "Loading…" : "Refresh history"}
                </button>
              </div>

              {metricHistoryLoading && metricHistory.length === 0 ? (
                <p className="mt-3 text-[8px] text-slate-600">Building evidence-backed metric timelines…</p>
              ) : metricHistory.length === 0 ? (
                <p className="mt-3 rounded-md border border-dashed border-white/[0.07] px-3 py-3 text-[8px] text-slate-600">No metric history is available yet. Apply at least one evidence observation.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {metricHistory.map((history) => {
                    const trendClass =
                      history.trend === "increasing"
                        ? "text-emerald-300"
                        : history.trend === "decreasing"
                          ? "text-red-300"
                          : history.trend === "stable"
                            ? "text-amber-300"
                            : "text-slate-500";
                    const maxValue = Math.max(history.target, history.currentValue, history.baseline, ...history.observations.map((point) => point.value), 1);
                    return (
                      <div key={String(history.metricId)} className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-semibold text-slate-200">{history.metricName}</p>
                            <p className="mt-0.5 text-[7px] text-slate-600">
                              {history.observationCount} reviewed observation{history.observationCount === 1 ? "" : "s"} · target {history.target.toLocaleString("en-IN")}{history.unit ? ` ${history.unit}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[8px] font-bold uppercase tracking-wider ${trendClass}`}>{history.trend}</p>
                            <p className="mt-0.5 text-[7px] text-slate-600">
                              current {history.currentValue.toLocaleString("en-IN")}{history.unit ? ` ${history.unit}` : ""}
                            </p>
                          </div>
                        </div>

                        {history.observations.length > 0 && (
                          <div className="mt-3">
                            <div className="relative h-12 rounded-md border border-white/[0.05] bg-[#08101b] px-2">
                              <div className="absolute inset-x-2 top-1/2 border-t border-dashed border-white/[0.06]" />
                              <div className="relative flex h-full items-end gap-1">
                                {history.observations.map((point, index) => (
                                  <div key={`${point.evidenceId}-${point.observedAt}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                                    <span className="max-w-full truncate text-[7px] font-semibold text-cyan-300">{point.value.toLocaleString("en-IN")}</span>
                                    <div
                                      className={`w-full max-w-12 rounded-t bg-cyan-400/60 ${point.isCurrent ? "ring-1 ring-cyan-200/60" : ""}`}
                                      style={{ height: `${Math.max(8, Math.min(38, (point.value / maxValue) * 38))}px` }}
                                      title={`${point.sourceName} · ${point.observedAt}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="mt-1 flex justify-between text-[7px] text-slate-700">
                              <span>{history.observations[0]?.observedAt || "—"}</span>
                              <span>{history.observations[history.observations.length - 1]?.observedAt || "—"}</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div className="rounded-md border border-white/[0.05] bg-white/[0.015] px-2.5 py-2">
                            <p className="text-[7px] uppercase tracking-wider text-slate-700">Latest change</p>
                            <p className="mt-1 text-[9px] font-semibold text-slate-300">
                              {history.delta == null ? "—" : `${history.delta > 0 ? "+" : ""}${history.delta.toFixed(1)}${history.unit ? ` ${history.unit}` : ""}`}
                            </p>
                            {history.deltaPercent != null && <p className="mt-0.5 text-[7px] text-slate-600">{history.deltaPercent > 0 ? "+" : ""}{history.deltaPercent.toFixed(1)}% vs previous</p>}
                          </div>
                          <div className="rounded-md border border-white/[0.05] bg-white/[0.015] px-2.5 py-2">
                            <p className="text-[7px] uppercase tracking-wider text-slate-700">Recent pace</p>
                            <p className="mt-1 text-[9px] font-semibold text-slate-300">
                              {history.ratePerDay == null ? "—" : `${(history.ratePerDay * 30).toFixed(1)} ${history.unit || "units"}/30d`}
                            </p>
                            <p className={`mt-0.5 text-[7px] ${history.paceStatus === "behind required pace" || history.paceStatus === "not progressing" ? "text-red-300" : "text-slate-600"}`}>{history.paceStatus}</p>
                          </div>
                          <div className="rounded-md border border-white/[0.05] bg-white/[0.015] px-2.5 py-2">
                            <p className="text-[7px] uppercase tracking-wider text-slate-700">Target remaining</p>
                            <p className="mt-1 text-[9px] font-semibold text-slate-300">{history.targetRemaining.toLocaleString("en-IN")}{history.unit ? ` ${history.unit}` : ""}</p>
                            <p className="mt-0.5 text-[7px] text-slate-600">{history.daysToTarget != null ? `${history.daysToTarget} days to target date` : "Target date not set"}</p>
                          </div>
                        </div>

                        {history.observations.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {history.observations.map((point, index) => (
                              <span key={`source-${point.evidenceId}-${index}`} className={`rounded-full border px-2 py-0.5 text-[7px] ${point.isCurrent ? "border-emerald-400/15 bg-emerald-400/[0.04] text-emerald-300" : "border-white/[0.05] text-slate-600"}`}>
                                {point.observedAt} · {point.sourceName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between"><p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">Evidence records</p><span className="text-[8px] text-slate-700">{evidence.length} records</span></div>
              {evidenceLoading ? (
                <div className="rounded-lg border border-white/[0.05] p-4 text-center text-[9px] text-slate-600">Loading evidence...</div>
              ) : evidence.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/[0.07] p-4 text-center text-[9px] text-slate-600">No evidence records yet. Add the first source above.</div>
              ) : (
                <div className="space-y-2">
                  {evidence.map((item) => (
                    <div key={String(item.id)} className="rounded-lg border border-white/[0.05] bg-black/10 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/[0.05] px-2 py-1 text-[8px] font-semibold text-slate-400">{item.evidenceType.replace("_", " ")}</span><span className="text-[9px] font-semibold text-slate-300">{item.sourceName}</span>{item.metricName && <span className="text-[8px] text-cyan-400">→ {item.metricName}</span>}{item.appliedAt && <span className={`rounded-full px-2 py-0.5 text-[7px] font-semibold ${item.isCurrent ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-400/10 text-slate-500"}`}>{item.isCurrent ? "CURRENT" : "HISTORICAL"}</span>}</div>
                          {item.observedAt && <p className="mt-1 text-[7px] text-slate-600">Evidence date: {item.observedAt}</p>}
                          {item.reference && (
                            <a
                              href={evidenceHref(item.reference)}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block truncate text-[8px] text-cyan-400 hover:text-cyan-300 hover:underline"
                            >
                              {item.reference}
                            </a>
                          )}
                          {item.reference.includes("/evidence/file/") && (
                            <div className="mt-2 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] p-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-cyan-300">Evidence intelligence</p>
                                  <p className="mt-1 text-[8px] text-slate-600">Extract values, then rank the strongest metric/value match before anything is changed.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={extractingEvidenceId === String(item.id)}
                                    onClick={() => void analyzeEvidence(String(item.id))}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/15 bg-cyan-400/[0.06] px-2.5 py-1.5 text-[8px] font-semibold text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-50"
                                  >
                                    <Sparkles size={10} />
                                    {extractingEvidenceId === String(item.id) ? "Analyzing…" : "Analyze file"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={extractingEvidenceId === String(item.id)}
                                    onClick={() => void recommendEvidence(String(item.id))}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-violet-400/15 bg-violet-400/[0.06] px-2.5 py-1.5 text-[8px] font-semibold text-violet-300 hover:bg-violet-400/10 disabled:opacity-50"
                                  >
                                    <Target size={10} />
                                    {extractingEvidenceId === String(item.id) ? "Working…" : "Recommend"}
                                  </button>
                                </div>
                              </div>

                              {recommendationResults[String(item.id)] && (
                                <div className="mt-2 rounded-lg border border-violet-400/15 bg-violet-400/[0.045] p-3">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-violet-300">Recommended match</span>
                                        <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[7px] font-semibold text-violet-200">{Math.round(recommendationResults[String(item.id)]!.confidence)}% confidence</span>
                                      </div>
                                      <p className="mt-1 text-[11px] font-bold text-slate-100">
                                        {recommendationResults[String(item.id)]!.recommendedValue} {recommendationResults[String(item.id)]!.unit}
                                        <span className="ml-2 text-[8px] font-medium text-slate-500">→ {recommendationResults[String(item.id)]!.metricName}</span>
                                      </p>
                                      <p className="mt-1 text-[8px] leading-relaxed text-slate-500">{recommendationResults[String(item.id)]!.explanation}</p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={extractingEvidenceId === String(item.id)}
                                      onClick={() => void applyRecommendation(String(item.id))}
                                      className="rounded-md bg-violet-400 px-2.5 py-1.5 text-[7px] font-bold text-slate-950 hover:bg-violet-300 disabled:opacity-50"
                                    >
                                      Confirm & apply
                                    </button>
                                  </div>
                                  {recommendationResults[String(item.id)]!.reasonCodes.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {recommendationResults[String(item.id)]!.reasonCodes.slice(0, 5).map((reason) => (
                                        <span key={reason} className="rounded-full border border-white/[0.06] px-2 py-0.5 text-[7px] text-slate-500">{reason}</span>
                                      ))}
                                    </div>
                                  )}
                                  {recommendationResults[String(item.id)]!.selectionNote && (
                                    <p className="mt-2 border-t border-white/[0.05] pt-2 text-[7px] text-violet-200/70">{recommendationResults[String(item.id)]!.selectionNote}</p>
                                  )}
                                </div>
                              )}

                              {extractionResults[String(item.id)]?.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  {extractionResults[String(item.id)].slice(0, 5).map((candidate, candidateIndex) => (
                                    <div key={`${candidate.value}-${candidateIndex}`} className="flex items-center justify-between gap-2 rounded-md border border-white/[0.05] bg-black/10 px-2.5 py-2">
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-semibold text-slate-200">{candidate.value}</p>
                                        <p className="mt-0.5 truncate text-[7px] text-slate-600">{candidate.context}</p>{candidate.reason && <p className="mt-0.5 text-[7px] text-cyan-500/70">{candidate.reason}</p>}
                                      </div>
                                      <div className="flex shrink-0 items-center gap-2">
                                        <span className="text-[8px] text-slate-500">{Math.round(candidate.confidence)}%</span>
                                        {item.metricId != null && (
                                          <button
                                            type="button"
                                            disabled={extractingEvidenceId === String(item.id)}
                                            onClick={() => void (async () => {
                                              const selected = candidate;
                                              setExtractingEvidenceId(String(item.id));
                                              try {
                                                const response = await fetch(
                                                  `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/evidence/${encodeURIComponent(String(item.id))}/extract`,
                                                  {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ metric_id: String(item.metricId), apply: true, selected_value: selected.value }),
                                                  }
                                                );
                                                const data = await response.json().catch(() => null);
                                                if (!response.ok) throw new Error(data?.detail || `Apply failed (${response.status})`);
                                                onProjectUpdated(normalizeProject(data?.project ?? project));
                                                await loadEvidence();
                                                await loadConsistency();
                                                await loadIntelligence();
                                                setExtractionMessages((current) => ({ ...current, [String(item.id)]: String(data?.message ?? `Reviewed ${selected.value} for ${item.metricName || "the selected metric"}.`) }));
                                              } catch (err) {
                                                setExtractionMessages((current) => ({ ...current, [String(item.id)]: err instanceof Error ? err.message : "Unable to apply value." }));
                                              } finally {
                                                setExtractingEvidenceId(null);
                                              }
                                            })()}
                                            className="rounded-md bg-cyan-400 px-2 py-1 text-[7px] font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                                          >
                                            Apply
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {extractionMessages[String(item.id)] && (
                                <p className="mt-2 text-[8px] text-slate-500">{extractionMessages[String(item.id)]}</p>
                              )}
                            </div>
                          )}
                          {item.notes && <p className="mt-2 text-[9px] leading-relaxed text-slate-500">{item.notes}</p>}
                        </div>
                        <div className="flex shrink-0 items-start gap-3"><div className="text-right">{item.extractedValue != null && <p className="text-[10px] font-semibold text-cyan-300">Value: {item.extractedValue}</p>}<p className="mt-1 text-[8px] text-slate-600">{Math.round(item.confidence)}% confidence</p></div><button type="button" disabled={deletingEvidenceId === String(item.id)} onClick={() => void removeEvidence(String(item.id))} className="rounded-md p-1.5 text-slate-700 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"><Trash2 size={12} /></button></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-violet-400/10 bg-violet-400/[0.035] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 text-violet-300" size={15} />
                <div>
                  <p className="text-[10px] font-semibold text-violet-200">Project intelligence</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-slate-500">Explainable signals combine delivery, cost, metric trajectory and evidence quality. Nothing is changed automatically.</p>
                </div>
              </div>
              <button type="button" onClick={() => void loadIntelligence()} disabled={intelligenceLoading} className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[8px] font-semibold text-slate-400 hover:text-white disabled:opacity-50">
                {intelligenceLoading ? "Analyzing…" : "Refresh"}
              </button>
            </div>

            {intelligenceError && <p className="mt-3 rounded-lg border border-red-500/10 bg-red-500/[0.04] px-3 py-2 text-[8px] text-red-300">{intelligenceError}</p>}

            {intelligence && (
              <>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
                    <p className="text-[7px] uppercase tracking-wider text-slate-600">Attention</p>
                    <div className="mt-1"><RiskBadge level={intelligence.attentionLevel} /></div>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
                    <p className="text-[7px] uppercase tracking-wider text-slate-600">Signals</p>
                    <p className="mt-1 text-sm font-bold">{intelligence.signalCount}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
                    <p className="text-[7px] uppercase tracking-wider text-slate-600">Evidence conflicts</p>
                    <p className="mt-1 text-sm font-bold">{intelligence.evidenceConflicts}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
                    <p className="text-[7px] uppercase tracking-wider text-slate-600">Measurement confidence</p>
                    <p className="mt-1 text-sm font-bold">{intelligence.measurementConfidence == null ? "—" : `${Math.round(intelligence.measurementConfidence)}%`}</p>
                  </div>
                </div>

                <p className="mt-3 text-[9px] leading-relaxed text-slate-400">{intelligence.summary}</p>

                {intelligence.signals.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {intelligence.signals.slice(0, 6).map((signal) => (
                      <div key={signal.id} className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <RiskBadge level={signal.level} />
                              <span className="text-[9px] font-semibold text-slate-200">{signal.title}</span>
                            </div>
                            <p className="mt-1 text-[8px] leading-relaxed text-slate-500">{signal.message}</p>
                          </div>
                          {signal.value != null && (
  <span className="shrink-0 text-[8px] font-semibold text-violet-300">
    {signal.code === "SCHEDULE_GAP" || signal.code === "COST_GAP" || signal.code === "METRIC_GAP" || signal.code === "METRIC_PACE_GAP"
      ? `${signal.value.toFixed(1)} pp`
      : signal.code === "EVIDENCE_CONFLICT" || signal.code === "EVIDENCE_VARIANCE"
        ? `${signal.value.toFixed(1)}% spread`
        : signal.code === "LOW_CONFIDENCE"
          ? `${signal.value.toFixed(0)}% confidence`
          : signal.code === "STALE_EVIDENCE"
            ? `${signal.value.toFixed(0)} days`
            : signal.value.toFixed(1)}
    {signal.threshold != null && <span className="ml-1 text-slate-600">· threshold {signal.threshold}</span>}
  </span>
)}
                        </div>
                        {signal.recommendedAction && <p className="mt-2 border-t border-white/[0.05] pt-2 text-[8px] text-slate-500"><span className="text-violet-300">Next:</span> {signal.recommendedAction}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {intelligence.recommendedActions.length > 0 && (
                  <div className="mt-3 rounded-lg border border-violet-400/10 bg-violet-400/[0.025] p-3">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-violet-300">Recommended review actions</p>
                    <ul className="mt-2 space-y-1.5">
                      {intelligence.recommendedActions.slice(0, 4).map((action, index) => (
                        <li key={`${action}-${index}`} className="text-[8px] leading-relaxed text-slate-500">• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-3 text-[7px] text-slate-700">Method: {intelligence.explainability?.method || "explainable project rules"} · Data changed: {intelligence.explainability?.dataChanged ? "yes" : "no"}</p>
              </>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between"><div><h4 className="text-xs font-semibold">Risk breakdown</h4><p className="mt-1 text-[9px] text-slate-600">Uses measured progress plus financial utilisation.</p></div><span className="text-lg font-bold">{Math.round(project.risk)}/100</span></div>
            <div className="grid gap-3 sm:grid-cols-2"><RiskDetail label="Overall risk" level={project.riskLevel} /><RiskDetail label="Cost risk" level={project.costRisk} /><RiskDetail label="Delay risk" level={project.delayRisk} /><RiskDetail label="Schedule status" level={progressGap > 0 ? project.riskLevel : "Low"} suffix={progressGap > 0 ? `${progressGap.toFixed(1)}% behind expected` : "On / ahead of expected progress"} /></div>
          </div>

          {alerts.length > 0 && (
            <div className="rounded-xl border border-red-500/10 bg-red-500/[0.035] p-4">
              <div className="mb-3 flex items-center justify-between"><div><h4 className="text-xs font-semibold">Active early warnings</h4><p className="mt-1 text-[9px] text-slate-600">Generated from live project indicators.</p></div><AlertTriangle size={15} className="text-red-400" /></div>
              <div className="space-y-2">{alerts.map((alert) => <div key={alert.id} className="rounded-lg border border-white/[0.06] bg-black/10 p-3"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><RiskBadge level={alert.level} /><span className="truncate text-[10px] font-semibold">{alert.title}</span></div><span className="shrink-0 text-[8px] uppercase tracking-wider text-slate-600">{alert.category}</span></div><p className="mt-2 text-[9px] leading-relaxed text-slate-500">{alert.text}</p></div>)}</div>
            </div>
          )}

          {error && <div className="rounded-xl border border-red-500/15 bg-red-500/[0.05] px-4 py-3 text-[10px] text-red-300">{error}</div>}

          <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[9px] text-slate-600">Deleting a project also removes its objectives, metrics and evidence records.</p>
            <button type="button" disabled={deleting} onClick={() => void onDelete(project.id)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-[10px] font-semibold text-red-400 hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-40"><Trash2 size={13} className={deleting ? "animate-pulse" : ""} /> {deleting ? "Deleting..." : "Delete Project"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="pv-interactive rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-[9px] uppercase tracking-[0.14em] text-slate-600">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function RiskDetail({
  label,
  level,
  suffix,
}: {
  label: string;
  level: RiskLevel;
  suffix?: string;
}) {
  return (
    <div className="pv-interactive flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div>
        <p className="text-[10px] font-medium text-slate-300">{label}</p>
        {suffix && <p className="mt-1 text-[8px] text-slate-600">{suffix}</p>}
      </div>
      <RiskBadge level={level} />
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  badge,
  danger = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-200 hover:translate-x-1 ${
        active
          ? "border border-blue-400/10 bg-gradient-to-r from-blue-500/15 to-cyan-500/5 text-blue-300 shadow-sm"
          : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-200"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={active ? "text-blue-400" : ""}>{icon}</span>
        {label}
      </span>

      {badge && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
            danger ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function Kpi({
  icon,
  title,
  value,
  detail,
  change,
  positive = false,
  gradient,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  change?: string;
  positive?: boolean;
  gradient: "blue" | "red" | "amber" | "cyan";
  onClick?: () => void;
}) {
  const gradients = {
    blue: "from-blue-500/10 to-blue-500/0 text-blue-400",
    red: "from-red-500/10 to-red-500/0 text-red-400",
    amber: "from-amber-500/10 to-amber-500/0 text-amber-400",
    cyan: "from-cyan-500/10 to-cyan-500/0 text-cyan-400",
  };

  const cardClass =
    "group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0f1b]/80 p-5 text-left transition-all duration-300 hover:-translate-y-2 hover:scale-[1.012] hover:border-white/[0.18] hover:bg-[#0b1120] hover:shadow-2xl hover:shadow-blue-950/30 focus:outline-none focus:ring-1 focus:ring-cyan-400/30";

  const content = (
    <>
      <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${gradients[gradient]} opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-90`} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[gradient]} transition-transform duration-300 group-hover:scale-105`}>
            {icon}
          </div>

          {change && (
            <span
              className={`flex items-center gap-0.5 text-[9px] font-semibold ${
                positive ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              {positive && <ArrowUpRight size={11} />}
              {change}
            </span>
          )}
        </div>

        <p className="mt-5 text-[10px] font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight transition-transform duration-300 group-hover:translate-x-0.5">
          {value}
        </p>
        <p className="mt-1 text-[9px] text-slate-700">{detail}</p>

        {onClick && (
          <div className="mt-4 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors group-hover:text-cyan-400">
            Open intelligence
            <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClass}>
        {content}
      </button>
    );
  }

  return <div className={cardClass}>{content}</div>;
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    Critical: "border-red-500/20 bg-red-500/10 text-red-400",
    High: "border-orange-500/20 bg-orange-500/10 text-orange-400",
    Medium: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    Low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };

  const dots: Record<RiskLevel, string> = {
    Critical: "bg-red-400",
    High: "bg-orange-400",
    Medium: "bg-amber-400",
    Low: "bg-emerald-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-[8px] font-bold uppercase tracking-wide ${styles[level]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[level]}`} />
      {level}
    </span>
  );
}

function RiskLegend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-2">
      <span className="flex items-center gap-2 text-[9px] text-slate-500">
        <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="text-[10px] font-semibold">{value}</span>
    </div>
  );
}

function riskIconClass(level: RiskLevel): string {
  const classes: Record<RiskLevel, string> = {
    Critical: "border-red-500/20 bg-red-500/10 text-red-400",
    High: "border-orange-500/20 bg-orange-500/10 text-orange-400",
    Medium: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    Low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };
  return classes[level];
}

function riskDotClass(score: number): string {
  if (score >= 80) return "bg-red-400 shadow-[0_0_7px_rgba(248,113,113,.8)]";
  if (score >= 65) return "bg-orange-400";
  if (score >= 45) return "bg-amber-400";
  return "bg-emerald-400";
}

function mapRiskColor(score: number): "red" | "orange" | "amber" | "green" {
  if (score >= 80) return "red";
  if (score >= 65) return "orange";
  if (score >= 45) return "amber";
  return "green";
}

function MapPoint({
  left,
  top,
  color,
  label,
}: {
  left: string;
  top: string;
  color: "red" | "orange" | "amber" | "green";
  label: string;
}) {
  const colors = {
    red: "bg-red-400 shadow-[0_0_16px_rgba(248,113,113,.8)]",
    orange: "bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,.7)]",
    amber: "bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,.7)]",
    green: "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.7)]",
  };

  return (
    <div className="absolute" style={{ left, top }}>
      <div className={`h-2.5 w-2.5 rounded-full ${colors[color]}`} />
      <span className="absolute left-4 top-[-3px] whitespace-nowrap text-[8px] text-slate-600">
        {label}
      </span>
    </div>
  );
}

function MapLegend({ color, text }: { color: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[8px] text-slate-500">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {text}
    </span>
  );
}
