
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
// Note: We are running this with node, so we need to load .env manually if not using react-scripts/vite
// But I will try to hardcode if reading .env is hard in this context, 
// OR I assume the user has the env vars? 
// No, I can read the .env file content first or just try to use the one likely in process.env if I run with vite?
// Easier: Just read .env file.

import fs from 'fs';
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not found in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase
        .from('arsip')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching arsip:", error);
    } else {
        if (data.length > 0) {
            const keys = Object.keys(data[0]);
            console.log("ALL KEYS:", JSON.stringify(keys));
            console.log("Has 'tujuan'?", keys.includes('tujuan'));
            console.log("Has 'tujuanSurat'?", keys.includes('tujuanSurat'));
            console.log("Has 'penerima'?", keys.includes('penerima'));
        } else {
            console.log("Arsip table is empty, cannot infer keys from data. Trying to insert to see specific error?");
        }
    }
}

inspect();
