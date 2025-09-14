import React, { useState } from 'react';

const Question = () => {
    const [question, setQuestion] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const res = await fetch('http://localhost:3001/exam/run1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ question })
            });
            
            const data = await res.json();
            console.log(data);
            setResponse(data);
        } catch (error) {
            console.error('Error:', error);
            setResponse({ error: 'Failed to get response' });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div style={{ fontFamily: 'sans-serif', margin: '2rem' }}>
            <h1>Ask a Question</h1>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question"
                    style={{ width: '300px', padding: '8px', marginRight: '10px' }}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Asking...' : 'Ask'}
                </button>
            </form>
            
            {response && (
                <div style={{ marginTop: '2rem' }}>
                    <h2>Question</h2>
                    <p>{response.input}</p>
                    <h2>Answer</h2>
                    {response.error ? (
                        <p style={{ color: 'red' }}>Error: {response.error}</p>
                    ) : (
                        <pre style={{ whiteSpace: 'pre-wrap' }}>{response.output}</pre>
                    )}
                </div>
            )}
        </div>
    )
}
export default Question;
