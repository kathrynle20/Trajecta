import React, { useState, useEffect } from 'react';

const Question = () => {
    const [questionData, setQuestionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:3001/exam/run1', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setQuestionData(data);
            } catch (error) {
                console.error('Error:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestion();
    }, []);

    if (loading) {
        return (
            <div>
                <h1>Question</h1>
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h1>Question</h1>
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Question</h1>
            {questionData && (
                <div>
                    <p>Response: {questionData.message}</p>
                    {/* You can add more fields from the response here */}
                    <pre>{JSON.stringify(questionData, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
export default Question;
