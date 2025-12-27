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
            google_drive_link: 'https://drive.google.com/file/d/xxxxx/view'
        },
        {
            nomor_surat: '002/ADM/2024',
            tanggal_surat: '2024-12-18',
            perihal: 'Contoh Undangan Rapat',
            kode_klasifikasi: 'ADM-002',
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
    if (row.nomor_surat && row.nomor_surat.trim()) {
        const { data: existing } = await supabase
            .from('arsip')
            .select('id')
            .eq('nomorSurat', row.nomor_surat.trim())
            .maybeSingle();

        if (existing) {
            errors.push('Nomor surat sudah ada di database');
        }
    }

    // 2. Tanggal Surat (required)
    if (!row.tanggal_surat) {
        errors.push('Tanggal surat wajib diisi');
    } else {
        const tanggal = parseExcelDate(row.tanggal_surat);
        if (!tanggal) {
            errors.push(`Format tanggal tidak valid (${row.tanggal_surat}). Gunakan YYYY-MM-DD`);
        } else if (tanggal > new Date()) {
            errors.push('Tanggal surat tidak boleh di masa depan');
        }
    }

    // 3. Perihal (required)
    if (!row.perihal || !row.perihal.trim()) {
        errors.push('Perihal wajib diisi');
    } else if (row.perihal.trim().length < 3) {
        errors.push('Perihal minimal 3 karakter');
    }

    // 4. Kode Klasifikasi (required)
    if (!row.kode_klasifikasi || !row.kode_klasifikasi.trim()) {
        errors.push('Kode klasifikasi wajib diisi');
    } else {
        const klasifikasi = klasifikasiMap.get(row.kode_klasifikasi.toUpperCase().trim());
        if (!klasifikasi) {
            errors.push(`Kode klasifikasi "${row.kode_klasifikasi}" tidak ditemukan`);
        }
    }

    // Get klasifikasi ID
    const klasifikasi = klasifikasiMap.get(row.kode_klasifikasi?.toUpperCase().trim());

    return {
        index,
        row,
        valid: errors.length === 0,
        errors,
        klasifikasiId: klasifikasi?.id
    };
};

/**
 * Batch validate all rows
 */
export const validateAllRows = async (rows, supabase, klasifikasiList, labelsList) => {
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
        const result = await validateRow(rows[i], i, supabase, klasifikasiMap, labelMap);
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
        const { row, klasifikasiId } = validRows[i];

        try {
            // Calculate retention date (5 years from letter date)
            const suratDate = parseExcelDate(row.tanggal_surat);

            if (!suratDate) {
                throw new Error(`Tanggal surat tidak valid: ${row.tanggal_surat}`);
            }

            const retensiDate = new Date(suratDate);
            retensiDate.setFullYear(retensiDate.getFullYear() + 5);

            // Insert arsip
            const { data: arsip, error: arsipError } = await supabase
                .from('arsip')
                .insert({
                    nomorSurat: row.nomor_surat?.trim() || null,
                    tanggalSurat: suratDate.toISOString().split('T')[0],
                    perihal: row.perihal.trim(),
                    kodeKlasifikasi: row.kode_klasifikasi.trim(),
                    googleDriveLink: row.google_drive_link?.trim() || null,
                    tanggalRetensi: retensiDate.toISOString(),
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

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
