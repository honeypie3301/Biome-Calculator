import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  limit
} from "firebase/firestore";
import { db } from "../firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface VisitorRecord {
  id: string;
  timestamp: string;
  device: string;
  resolution: string;
  isCurrentDevice: boolean;
}

export interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  records: VisitorRecord[];
  isLive: boolean;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.warn("Firestore Operation Warning:", JSON.stringify(errInfo));
}

const STATS_DOC_PATH = "visitor_stats/global";
const SESSIONS_COLLECTION_PATH = "visitor_sessions";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "dev_unknown";
  let devId = localStorage.getItem("backwoods_device_id");
  if (!devId) {
    devId = `dev_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("backwoods_device_id", devId);
  }
  return devId;
}

export function isDeviceOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("backwoods_do_not_track") === "true";
}

export function setDeviceOptedOut(optedOut: boolean): void {
  if (typeof window === "undefined") return;
  if (optedOut) {
    localStorage.setItem("backwoods_do_not_track", "true");
  } else {
    localStorage.removeItem("backwoods_do_not_track");
  }
}

export async function logVisitorSession(): Promise<void> {
  if (typeof window === "undefined") return;
  if (isDeviceOptedOut()) return;

  const sessionKey = "backwoods_live_session_registered";
  if (sessionStorage.getItem(sessionKey)) return;

  const currentDevId = getDeviceId();
  const isFirstVisit = !localStorage.getItem("backwoods_has_visited_before");
  localStorage.setItem("backwoods_has_visited_before", "true");

  const ua = navigator.userAgent;
  const browser = ua.includes("Firefox")
    ? "Firefox"
    : ua.includes("Edg")
    ? "Edge"
    : ua.includes("Chrome")
    ? "Chrome"
    : ua.includes("Safari")
    ? "Safari"
    : "Browser";
  const os = ua.includes("Win")
    ? "Windows"
    : ua.includes("Mac")
    ? "macOS"
    : ua.includes("Linux")
    ? "Linux"
    : ua.includes("Android")
    ? "Android"
    : ua.includes("iPhone") || ua.includes("iPad")
    ? "iOS"
    : "OS";
  const deviceStr = `${browser} / ${os}`;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  sessionStorage.setItem(sessionKey, "true");

  try {
    // 1. Record session in visitor_sessions
    const sessionDocRef = doc(db, SESSIONS_COLLECTION_PATH, sessionId);
    await setDoc(sessionDocRef, {
      sessionId,
      visitorId: currentDevId,
      device: deviceStr.slice(0, 32),
      browser: browser.slice(0, 32),
      os: os.slice(0, 32),
      screen: screenRes.slice(0, 32),
      referrer: (document.referrer || "direct").slice(0, 256),
      path: (window.location.pathname || "/").slice(0, 128),
      isFirstVisit,
      timestamp: nowIso.slice(0, 64)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, SESSIONS_COLLECTION_PATH);
  }

  try {
    // 2. Increment stats in visitor_stats/global
    const statsDocRef = doc(db, "visitor_stats", "global");
    const snap = await getDoc(statsDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const isSameDay = data.lastDate === todayStr;
      const totalVisits = (Number(data.totalVisits) || 0) + 1;
      const uniqueVisitors = (Number(data.uniqueVisitors) || 0) + (isFirstVisit ? 1 : 0);
      const todayVisits = isSameDay ? (Number(data.todayVisits) || 0) + 1 : 1;

      await setDoc(statsDocRef, {
        totalVisits,
        uniqueVisitors,
        todayVisits,
        lastDate: todayStr,
        updatedAt: nowIso
      });
    } else {
      // First-ever initialization
      await setDoc(statsDocRef, {
        totalVisits: 1,
        uniqueVisitors: 1,
        todayVisits: 1,
        lastDate: todayStr,
        updatedAt: nowIso
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, STATS_DOC_PATH);
  }
}

export function subscribeToVisitorAnalytics(
  onUpdate: (data: AnalyticsData) => void
): () => void {
  const currentDevId = getDeviceId();
  let latestStats = {
    totalVisits: 0,
    uniqueVisitors: 0,
    todayVisits: 0,
    isLive: false
  };
  let latestRecords: VisitorRecord[] = [];

  const emit = () => {
    onUpdate({
      totalVisits: latestStats.totalVisits,
      uniqueVisitors: latestStats.uniqueVisitors,
      todayVisits: latestStats.todayVisits,
      records: latestRecords,
      isLive: latestStats.isLive
    });
  };

  // Subscribe to aggregated counters
  const unsubStats = onSnapshot(
    doc(db, "visitor_stats", "global"),
    (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        latestStats = {
          totalVisits: Number(d.totalVisits) || 0,
          uniqueVisitors: Number(d.uniqueVisitors) || 0,
          todayVisits: Number(d.todayVisits) || 0,
          isLive: true
        };
      } else {
        latestStats = {
          totalVisits: 0,
          uniqueVisitors: 0,
          todayVisits: 0,
          isLive: true
        };
      }
      emit();
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, STATS_DOC_PATH);
    }
  );

  // Subscribe to recent sessions collection
  const q = query(
    collection(db, SESSIONS_COLLECTION_PATH),
    limit(30)
  );

  const unsubSessions = onSnapshot(
    q,
    (querySnap) => {
      const records: VisitorRecord[] = [];
      querySnap.forEach((docSnap) => {
        const d = docSnap.data();
        let formattedTime = "";
        try {
          const dt = new Date(d.timestamp);
          formattedTime = isNaN(dt.getTime())
            ? ""
            : dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch {
          formattedTime = "";
        }
        records.push({
          id: docSnap.id,
          timestamp: formattedTime || "Just now",
          device: `${d.browser || "Browser"} / ${d.os || "OS"}`,
          resolution: d.screen || "Unknown",
          isCurrentDevice: d.visitorId === currentDevId
        });
      });
      // Sort in-memory by id or timestamp descending
      records.reverse();
      latestRecords = records;
      emit();
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, SESSIONS_COLLECTION_PATH);
    }
  );

  return () => {
    unsubStats();
    unsubSessions();
  };
}
