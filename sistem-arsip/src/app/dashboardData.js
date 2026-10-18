import { getArsipStatus } from "../features/arsip/utils/statusUtils.js";

const percentageChange = (current, previous) =>
  previous === 0
    ? current > 0
      ? 100
      : 0
    : Math.round(((current - previous) / previous) * 100);

export function deriveDashboardData(
  archives = [],
  classifications = [],
  now = new Date(),
) {
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const activeArchives = [];
  const inactiveArchives = [];
  const years = new Map();
  const current = { total: 0, active: 0, inactive: 0 };
  const previous = { total: 0, active: 0, inactive: 0 };

  for (const archive of archives) {
    const isActive = getArsipStatus(archive, classifications, now) === "Aktif";
    (isActive ? activeArchives : inactiveArchives).push(archive);
    const date = archive.tanggalSurat ? new Date(archive.tanggalSurat) : null;
    if (!date || Number.isNaN(date.getTime())) continue;
    const year = date.getFullYear();
    const month = date.getMonth();
    if (!years.has(year)) years.set(year, { name: year, Aktif: 0, Inaktif: 0 });
    years.get(year)[isActive ? "Aktif" : "Inaktif"]++;
    const period =
      year === now.getFullYear() && month === now.getMonth()
        ? current
        : year === previousMonth.getFullYear() &&
            month === previousMonth.getMonth()
          ? previous
          : null;
    if (period) {
      period.total++;
      period[isActive ? "active" : "inactive"]++;
    }
  }

  return {
    stats: {
      total: archives.length,
      active: activeArchives.length,
      inactive: inactiveArchives.length,
    },
    trends: Object.fromEntries(
      Object.keys(current).map((key) => [
        key,
        percentageChange(current[key], previous[key]),
      ]),
    ),
    activeArchives,
    inactiveArchives,
    archivesByYear: [...years.values()].sort((a, b) => a.name - b.name),
  };
}
