const SUPABASE_URL = 'https://bfsddnjwjbqlxfxxlorf.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc2Rkbmp3amJxbHhmeHhsb3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTIyNDksImV4cCI6MjA4NDYyODI0OX0.hBhQl9MDiIRIhXVEwnVELMhrhC_5aTcBwIIEOPV5psg';

async function testEdgeFunction() {
    console.log('Testando Edge Function create-client-account...\n');

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/create-client-account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`,
                'apikey': ANON_KEY,
            },
            body: JSON.stringify({
                email: 'test_edge@teste.com',
                password: '123456',
                full_name: 'Teste Edge Function',
            }),
        });

        console.log('Status:', response.status, response.statusText);
        
        const text = await response.text();
        console.log('Response body:', text);
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}

testEdgeFunction();
