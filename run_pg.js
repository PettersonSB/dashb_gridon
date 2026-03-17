import pg from 'pg';
import fs from 'fs';

async function run() {
    const client = new pg.Client({
        user: 'postgres.ncknuhgrmdypxmsqeyys',
        password: 'pSSt&D0k2VvWf5tN',
        host: 'aws-0-sa-east-1.pooler.supabase.com',
        port: 5432, // session mode port
        database: 'postgres'
    });
    
    try {
        console.log("Connecting using Session Port 5432...");
        await client.connect();
        
        console.log("Reading SQL file...");
        const sql = fs.readFileSync('supabase/migrations/create_products_and_kit_items.sql', 'utf8');
        
        console.log("Executing SQL...");
        await client.query(sql);
        console.log("Migration executed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

run();
