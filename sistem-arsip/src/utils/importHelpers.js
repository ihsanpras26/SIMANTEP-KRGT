import * as XLSX from 'xlsx';

/**
 * Helper to parse various date formats from Excel
 * Handles: Serial numbers (46000), ISO strings, Date objects
 */
const parseExcelDate = (dateVal) => {
    if (!dateVal) return null;

    // If it's already a Date object
    if (dateVal instanceof Date) {
        return isNaN(dateVal.getTime()) ? null : dateVal;
    }

    // If it's a number or numeric string (Excel serial date)
    // Excel serial date 1 = 1900-01-01
    // JS uses 1970-01-01. Diff is 25569 days.
    if (typeof dateVal === 'number' || (!isNaN(dateVal) && !isNaN(parseFloat(dateVal)))) {
        const serial = parseFloat(dateVal);
        // Basic check to avoid treating regular numbers (like IDs) as dates if they are too small/large
        // 10000 = 1927, 60000 = 2064. Reasonable range for this app?
        if (serial > 10000 && serial < 60000) {
            const utc_days = Math.floor(serial - 25569);
            const utc_value = utc_days * 86400;
            const date_info = new Date(utc_value * 1000);

            // Adjust for timezone offset if needed, but usually UTC calculation is safest for dates
            // Excel dates are technically "local" without timezone, so we output as local date at 00:00
            // But simple JS Date(ms) creates local time.
            return date_info;
        }
    }

    // Try parsing as standard string
    const date = new Date(dateVal);
    if (!isNaN(date.getTime())) return date;

    return null;
};

/**
 * Generate Excel template for bulk import
 */
export const generateTemplate = () => {
    const template = [
        {
            nomor_surat: '001/ADM/2024',
            tanggal_surat: '2024-12-19',
            perihal: 'Contoh Surat Keputusan',
            kode_klasifikasi: 'ADM-001',
            pengirim: 'Dinas Pendidikan',
            tujuan_surat: 'Kepala Sekolah',
            google_drive_link: 'https://drive.google.com/file/d/xxxxx/view'
        },
        {
            nomor_surat: '002/ADM/2024',
            tanggal_surat: '2024-12-18',
            perihal: 'Contoh Undangan Rapat',
            kode_klasifikasi: 'ADM-002',
            pengirim: '',
            tujuan_surat: '',
            google_drive_link: ''
        }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);

    // Set column widths
    ws['!cols'] = [
        { wch: 20 }, // nomor_surat
        { wch: 15 }, // tanggal_surat
        { wch: 40 }, // perihal
        { wch: 20 }, // kode_klasifikasi
        { wch: 20 }, // pengirim
        { wch: 20 }, // tujuan_surat
        { wch: 45 }  // google_drive_link
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Template Arsip');
    XLSX.writeFile(wb, 'template_import_arsip.xlsx');
};

/**
 * Parse uploaded Excel or CSV file
 */
export const parseFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                // cellDates: true helps, but we still need robust fallback
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                resolve(jsonData);
            } catch (error) {
                reject(new Error('Gagal membaca file. Pastikan format file benar.'));
            }
        };

        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Validate a single row of data
 */
export const validateRow = async (row, index, supabase, klasifikasiMap, labelMap) => {
    const errors = [];

    // 1. Nomor Surat (optional but must be unique if provided)
    // mode: 'create' (default) -> Error if exists
    // mode: 'update' -> Warning/Info if exists (will update), OK if new (will insert)
    let updateTargetId = null;
    let isUpdate = false;

    const nomorSurat = row.nomor_surat ? String(row.nomor_surat).trim() : '';
    if (nomorSurat) {
        const { data: existing } = await supabase
            .from('arsip')
            .select('id')
            .eq('nomorSurat', nomorSurat)
            .maybeSingle();

        if (existing) {
            if (row.mode === 'create') {
                errors.push('Nomor surat sudah ada di database');
            } else {
                // Update mode: This is valid, we interpret it as an UPDATE
                updateTargetId = existing.id;
                isUpdate = true;
            }
        }
    }

    // 2. Tanggal Surat (required for Create, optional for Update)
    if (!row.tanggal_surat) {
        if (!isUpdate) errors.push('Tanggal surat wajib diisi');
    } else {
        const tanggal = parseExcelDate(row.tanggal_surat);
        if (!tanggal) {
            errors.push(`Format tanggal tidak valid (${row.tanggal_surat}). Gunakan YYYY-MM-DD`);
        } else if (tanggal > new Date()) {
            errors.push('Tanggal surat tidak boleh di masa depan');
        }
    }

    // 3. Perihal (required for Create, optional for Update)
    const perihal = row.perihal ? String(row.perihal).trim() : '';
    if (!perihal && !isUpdate) {
        errors.push('Perihal wajib diisi');
    } else if (perihal && perihal.length < 3) {
        errors.push('Perihal minimal 3 karakter');
    }

    // 4. Kode Klasifikasi (required for Create, optional for Update)
    const kodeKlasifikasiInput = row.kode_klasifikasi ? String(row.kode_klasifikasi).trim() : '';
    if (!kodeKlasifikasiInput && !isUpdate) {
        errors.push('Kode klasifikasi wajib diisi');
    } else if (kodeKlasifikasiInput) {
        const klasifikasi = klasifikasiMap.get(kodeKlasifikasiInput.toUpperCase());
        if (!klasifikasi) {
            errors.push(`Kode klasifikasi "${kodeKlasifikasiInput}" tidak ditemukan`);
        }
    }

    // Get klasifikasi ID
    const klasifikasi = klasifikasiMap.get(kodeKlasifikasiInput.toUpperCase());

    return {
        index,
        row,
        valid: errors.length === 0,
        errors,
        klasifikasiId: klasifikasi?.id,
        isUpdate,
        updateTargetId
    };
};

/**
 * Batch validate all rows
 */
export const validateAllRows = async (rows, supabase, klasifikasiList, labelsList, mode = 'create') => {
    // Create maps for faster lookup
    const klasifikasiMap = new Map(
        klasifikasiList.map(k => [k.kode.toUpperCase(), k])
    );

    const labelMap = new Map(
        labelsList.map(l => [l.name.toLowerCase(), l])
    );

    // Validate each row
    const validationResults = [];
    for (let i = 0; i < rows.length; i++) {
        // Inject mode into row for validateRow to use
        const rowWithMode = { ...rows[i], mode };
        const result = await validateRow(rowWithMode, i, supabase, klasifikasiMap, labelMap);
        validationResults.push(result);
    }

    return validationResults;
};

/**
 * Import valid rows to database
 */
export const importValidRows = async (validatedData, supabase, onProgress) => {
    const validRows = validatedData.filter(d => d.valid);
    const results = {
        total: validRows.length,
        success: 0,
        failed: 0,
        errors: []
    };

    for (let i = 0; i < validRows.length; i++) {
        const { row, klasifikasiId, isUpdate, updateTargetId } = validRows[i];

        try {
            const payload = {};

            // Helper to conditionally add fields
            if (row.nomor_surat) payload.nomorSurat = String(row.nomor_surat).trim();
            if (row.perihal) payload.perihal = String(row.perihal).trim();
            if (row.kode_klasifikasi) payload.kodeKlasifikasi = String(row.kode_klasifikasi).trim();
            if (row.pengirim) payload.pengirim = String(row.pengirim).trim();
            if (row.tujuan_surat) payload.tujuanSurat = String(row.tujuan_surat).trim();
            if (row.google_drive_link) payload.googleDriveLink = String(row.google_drive_link).trim();

            if (row.tanggal_surat) {
                const suratDate = parseExcelDate(row.tanggal_surat);
                if (!suratDate) throw new Error(`Tanggal surat tidak valid: ${row.tanggal_surat}`);

                payload.tanggalSurat = suratDate.toISOString().split('T')[0];

                // Recalculate retention only if date changed or on insert
                const retensiDate = new Date(suratDate);
                retensiDate.setFullYear(retensiDate.getFullYear() + 5);
                payload.tanggalRetensi = retensiDate.toISOString();
            }

            let query;
            if (isUpdate && updateTargetId) {
                // UPDATE - Only update fields present in payload
                query = supabase
                    .from('arsip')
                    .update({
                        ...payload
                    })
                    .eq('id', updateTargetId);
            } else {
                // INSERT - Validate required fields again just in case (though validateRow handles it)
                if (!payload.tanggalSurat) throw new Error("Tanggal surat wajib untuk data baru");
                if (!payload.perihal) throw new Error("Perihal wajib untuk data baru");
                if (!payload.kodeKlasifikasi) throw new Error("Kode klasifikasi wajib untuk data baru");

                query = supabase
                    .from('arsip')
                    .insert({
                        ...payload,
                        created_at: new Date().toISOString()
                    });
            }

            const { error: arsipError } = await query.select().single();

            if (arsipError) throw arsipError;

            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push({
                row: i + 1,
                nomorSurat: row.nomor_surat || '-',
                perihal: row.perihal,
                error: error.message
            });
        }

        // Update progress
        if (onProgress) {
            onProgress(((i + 1) / validRows.length) * 100);
        }
    }

    return results;
};
