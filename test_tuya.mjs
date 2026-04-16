const res = await fetch('https://bfsddnjwjbqlxfxxlorf.supabase.co/functions/v1/tuya-token', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc2Rkbmp3amJxbHhmeHhsb3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTIyNDksImV4cCI6MjA4NDYyODI0OX0.hBhQl9MDiIRIhXVEwnVELMhrhC_5aTcBwIIEOPV5psg',
    },
    body: JSON.stringify({ device_id: 'eb1d993ea81d9f0f8dbkc8' }),
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
