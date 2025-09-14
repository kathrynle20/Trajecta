import React from 'react';

const Question = () => {
    
    const question = fetch('http://localhost:3001/exam/run1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
    .then(response => response)
    .catch(error => console.error('Error:', error));
    return (
        <div>
            <h1>Question</h1>
        </div>
    )
}
export default Question;
