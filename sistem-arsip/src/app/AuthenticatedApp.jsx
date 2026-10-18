import { lazy, Suspense, useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "../components/layout/Layout";
import { supabase } from "../lib/supabaseClient";
import { ARSIP_KEYS } from "../features/arsip/hooks/useArsip";
import { KLASIFIKASI_KEYS } from "../features/klasifikasi/hooks/useKlasifikasi";
import { LABEL_KEYS } from "../features/labels/hooks/useLabels";
import { getArsipReturnPath } from "../features/arsip/utils/listState";
import RouteLoading from "./RouteLoading";
import RouteErrorBoundary from "./RouteErrorBoundary";

const DashboardRoute = lazy(() => import("./routes/DashboardRoute"));
const ArchiveFormRoute = lazy(() => import("./routes/ArchiveFormRoute"));
const ArsipList = lazy(() => import("../features/arsip/components/ArsipList"));
const ArsipDetailPage = lazy(
  () => import("../features/arsip/pages/ArsipDetailPage"),
);
const KlasifikasiManager = lazy(
  () => import("../features/klasifikasi/components/KlasifikasiManager"),
);
const LabelDashboard = lazy(
  () => import("../features/labels/components/LabelDashboard"),
);

function pageTitle(pathname) {
  if (pathname === "/") return "Ringkasan";
  if (pathname === "/arsip/tambah") return "Tambah arsip";
  if (pathname === "/semua-arsip") return "Semua arsip";
  if (pathname === "/arsip") return "Daftar arsip";
  if (pathname === "/label") return "Label arsip";
  if (pathname === "/klasifikasi") return "Klasifikasi";
  if (/^\/arsip\/[^/]+\/edit$/.test(pathname)) return "Edit arsip";
  if (pathname.startsWith("/arsip/")) return "Detail arsip";
  return "SIMANTEP";
}

export default function AuthenticatedApp({ session, onLogout }) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const invalidate = (keys) => {
      keys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    };
    const channel = supabase
      .channel(`workspace:${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "arsip" },
        () => invalidate([ARSIP_KEYS.all, LABEL_KEYS.all]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "klasifikasi" },
        () => invalidate([KLASIFIKASI_KEYS.all, ARSIP_KEYS.all]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "labels" },
        () => invalidate([LABEL_KEYS.all, ARSIP_KEYS.all]),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "arsip_labels" },
        () => invalidate([ARSIP_KEYS.all, LABEL_KEYS.all]),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, session.user.id]);

  const returnPath = () =>
    getArsipReturnPath(
      new URLSearchParams(location.search).get("from") ||
        `${location.pathname}${location.search}`,
    );
  const openArchive = (item, editing = false) => {
    if (!item?.id) return;
    queryClient.setQueryData(ARSIP_KEYS.detail(String(item.id)), item);
    navigate(
      `/arsip/${encodeURIComponent(item.id)}${editing ? "/edit" : ""}?${new URLSearchParams({ from: returnPath() })}`,
    );
  };
  const setSelectedArsipDetail = (item) => openArchive(item);
  const listProps = {
    supabase,
    setEditingArsip: (item) => openArchive(item, true),
    setSelectedArsipDetail,
  };

  return (
    <Layout
      user={session.user}
      onLogout={onLogout}
      title={pageTitle(location.pathname)}
      setSelectedArsipDetail={setSelectedArsipDetail}
      onNavigate={() => {}}
    >
      <RouteErrorBoundary key={location.pathname}>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route
              path="/"
              element={
                <DashboardRoute
                  setSelectedArsipDetail={setSelectedArsipDetail}
                />
              }
            />
            <Route
              path="/arsip"
              element={<ArsipList {...listProps} title="Daftar arsip" />}
            />
            <Route
              path="/semua-arsip"
              element={<ArsipList {...listProps} title="Semua arsip" />}
            />
            <Route path="/arsip/tambah" element={<ArchiveFormRoute />} />
            <Route path="/arsip/:id/edit" element={<ArchiveFormRoute />} />
            <Route
              path="/arsip/detail"
              element={<Navigate to="/arsip" replace />}
            />
            <Route path="/arsip/:id" element={<ArsipDetailPage />} />
            <Route path="/label" element={<LabelDashboard />} />
            <Route path="/klasifikasi" element={<KlasifikasiManager />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </Layout>
  );
}
