
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_KEY);

async function checkColumn() {
    // Try to select the 'icon' column. If it fails, it doesn't exist.
    const { data, error } = await supabase
        .from('labels')
        .select('icon')
        .limit(1);

    if (error) {
        console.log("Error selecting 'icon':", error.message);
        console.log("COLUMN_EXISTS: false");
    } else {
        console.log("COLUMN_EXISTS: true");
    }
}

checkColumn();
