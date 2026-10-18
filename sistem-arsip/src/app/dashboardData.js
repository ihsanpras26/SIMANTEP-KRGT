import {
  parseArchiveDate,
  safeDocumentUrl,
} from '../features/arsip/utils/archiveFields.js';

const clean = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
const keyOf = (value) => clean(value).toLocaleLowerCase('id-ID');
const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];
const stamp = (year, month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const daysIn = (year, month) => new Date(year, month, 0).getDate();
const inRange = (date, start, end) => !!date && date >= start && date <= end;
const sortRank = (a, b) =>
  b.count - a.count || a.label.localeCompare(b.label, 'id', { numeric: true });

export function deriveDashboardData(
  archives = [],
  classifications = [],
  now = new Date(),
  selection = {},
) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const today = stamp(currentYear, currentMonth, now.getDate());
  const knownCodes = new Map(
    classifications.map((item) => [keyOf(item.kode), item]),
  );
  const source = archives.map((archive) => {
    const classificationKey = keyOf(archive.kodeKlasifikasi);
    const classification = knownCodes.get(classificationKey);
    return {
      ...archive,
      reportDate: parseArchiveDate(archive.tanggalSurat),
      hasDigital: !!(
        safeDocumentUrl(archive.googleDriveLink) || clean(archive.filePath)
      ),
      senderKey: keyOf(archive.pengirim),
      senderLabel: clean(archive.pengirim),
      classificationKey,
      classificationLabel:
        classification?.deskripsi ||
        (classificationKey ? 'Kode belum terdaftar' : 'Tanpa klasifikasi'),
      classificationCode: clean(
        classification?.kode || archive.kodeKlasifikasi,
      ),
      classificationKnown: !!classification,
    };
  });
  const availableYears = [
    ...new Set(
      source
        .filter((item) => item.reportDate)
        .map((item) => Number(item.reportDate.slice(0, 4))),
    ),
  ].sort((a, b) => b - a);
  const year = availableYears.includes(Number(selection.year))
    ? String(Number(selection.year))
    : 'all';
  const month =
    year !== 'all' && /^(?:[1-9]|1[0-2])$/.test(String(selection.month))
      ? String(Number(selection.month))
      : 'all';
  const selectedYear = Number(year);
  const selectedMonth = Number(month);
  let start = null,
    end = null,
    comparison = null;
  let label = 'Semua tahun';
  if (year !== 'all') {
    start = stamp(selectedYear, month === 'all' ? 1 : selectedMonth, 1);
    end =
      month === 'all'
        ? stamp(selectedYear, 12, 31)
        : stamp(
            selectedYear,
            selectedMonth,
            daysIn(selectedYear, selectedMonth),
          );
    label =
      month === 'all'
        ? `Tahun ${year}`
        : `${months[selectedMonth - 1]} ${year}`;
    const partial = start <= today && end > today;
    if (partial) end = today;
    if (start <= today) {
      let previousYear = selectedYear - 1;
      let previousMonth = month === 'all' ? 1 : selectedMonth - 1;
      if (month !== 'all') {
        previousYear = selectedYear;
        if (!previousMonth) {
          previousYear--;
          previousMonth = 12;
        }
      }
      const previousStart = stamp(previousYear, previousMonth, 1);
      const endMonth =
        month === 'all' ? (partial ? currentMonth : 12) : previousMonth;
      const endDay = partial
        ? Math.min(now.getDate(), daysIn(previousYear, endMonth))
        : daysIn(previousYear, endMonth);
      comparison = {
        start: previousStart,
        end: stamp(previousYear, endMonth, endDay),
        label:
          month === 'all'
            ? String(previousYear)
            : `${months[previousMonth - 1]} ${previousYear}`,
        partial,
      };
    }
  }
  const rows = source.filter(
    (item) => year === 'all' || inRange(item.reportDate, start, end),
  );
  if (comparison) {
    const previous = source.filter((item) =>
      inRange(item.reportDate, comparison.start, comparison.end),
    ).length;
    comparison = {
      ...comparison,
      previous,
      delta: rows.length - previous,
      percent: previous ? ((rows.length - previous) / previous) * 100 : null,
    };
  }
  const classificationGroups = new Map();
  const senderGroups = new Map();
  for (const item of rows) {
    const group = classificationGroups.get(item.classificationKey) || {
      key: item.classificationKey,
      code: item.classificationCode,
      label: item.classificationLabel,
      known: item.classificationKnown,
      count: 0,
    };
    group.count++;
    classificationGroups.set(item.classificationKey, group);
    if (item.senderKey) {
      const sender = senderGroups.get(item.senderKey) || {
        key: item.senderKey,
        label: item.senderLabel,
        count: 0,
      };
      sender.count++;
      senderGroups.set(item.senderKey, sender);
    }
  }
  let series;
  if (year === 'all') {
    series = [...availableYears]
      .reverse()
      .map((value) => ({ key: String(value), label: String(value), count: 0 }));
  } else if (month === 'all') {
    const length = selectedYear === currentYear ? currentMonth : 12;
    series = months
      .slice(0, length)
      .map((value, index) => ({
        key: stamp(selectedYear, index + 1, 1).slice(0, 7),
        label: value,
        count: 0,
      }));
  } else {
    const length =
      selectedYear === currentYear && selectedMonth === currentMonth
        ? now.getDate()
        : daysIn(selectedYear, selectedMonth);
    series = Array.from({ length }, (_, index) => ({
      key: stamp(selectedYear, selectedMonth, index + 1),
      label: String(index + 1),
      count: 0,
    }));
  }
  const seriesMap = new Map(series.map((point) => [point.key, point]));
  for (const item of rows) {
    const key =
      year === 'all'
        ? item.reportDate.slice(0, 4)
        : month === 'all'
          ? item.reportDate.slice(0, 7)
          : item.reportDate;
    const point = seriesMap.get(key);
    if (point) point.count++;
  }
  const digital = rows.filter((item) => item.hasDigital).length;
  return {
    period: { year, month },
    label,
    start,
    end,
    comparison,
    availableYears,
    sourceTotal: source.length,
    metrics: {
      total: rows.length,
      digital,
      missingDigital: rows.length - digital,
      digitalPercent: rows.length
        ? Math.round((digital / rows.length) * 100)
        : null,
      classifications: [...classificationGroups.values()].filter(
        (item) => item.known,
      ).length,
      senders: senderGroups.size,
    },
    quality: {
      undated: source.filter((item) => !item.reportDate).length,
      missingSender: rows.filter((item) => !item.senderKey).length,
      unknownClassification: rows.filter((item) => !item.classificationKnown)
        .length,
    },
    series,
    classifications: [...classificationGroups.values()].sort(sortRank),
    senders: [...senderGroups.values()].sort(sortRank),
    rows: [...rows].sort(
      (a, b) =>
        b.reportDate.localeCompare(a.reportDate) ||
        String(a.id).localeCompare(String(b.id), 'id', { numeric: true }),
    ),
  };
}
