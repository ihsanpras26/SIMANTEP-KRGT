export const getArsipStatus = (arsip, klasifikasiList) => {
  if (!arsip) return 'Inaktif';

  const klasifikasi = klasifikasiList.find(k => k.kode === arsip.kodeKlasifikasi);
  const isPermanent = klasifikasi && Number(klasifikasi.retensiAktif) === 0 && Number(klasifikasi.retensiInaktif) === 0;

  if (isPermanent) return 'Aktif';

  // If no retention date is set, default to Active (assuming it hasn't expired yet)
  if (!arsip.tanggalRetensi) return 'Aktif';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const retensiDate = new Date(arsip.tanggalRetensi);
  retensiDate.setHours(0, 0, 0, 0);

  // Active if today is before or equal to retention date
  return retensiDate >= today ? 'Aktif' : 'Inaktif';
};
