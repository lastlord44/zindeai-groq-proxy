export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Groq API Proxy</h1>
      <p>API endpoint: <code>/api/groq</code></p>
      <p>Method: POST</p>
      <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '4px' }}>
{`// Example usage:
fetch('/api/groq', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    stream: true
  })
})`}
      </pre>
    </div>
  )
}