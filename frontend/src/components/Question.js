import React, { useState } from 'react';
import CourseGraph from './CourseGraph';

const API_BASE = 'http://localhost:3001/exam';

const KNOWN_TOPICS = new Set([
  'math','cs','ai','ml','nlp','data','economics','history','languages','art',
  'biology','robotics','algorithms','systems','web','physics','quantum','stats','education','design'
]);

const Question = () => {
  const [seedInterests, setSeedInterests] = useState('ml,data'); // optional hint
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]); // array from AI
  const [qMeta, setQMeta] = useState({ version: 'v1' });
  const [answers, setAnswers] = useState({}); // { [id]: value }
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState(null);

  async function fetchQuestions(e) {
    e?.preventDefault?.();
    setLoading(true); setError(null); setVerdict(null);
    try {
      const seed = {
        interests_hint: seedInterests
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        language: 'English',
        count_min: 4, count_max: 9
      };
      const res = await fetch(`${API_BASE}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seed })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      const out = data.output || {};
      setQMeta({ version: out.version || 'v1' });
      setQuestions(Array.isArray(out.questions) ? out.questions : []);
      setAnswers({}); // reset
    } catch (err) {
      setError(`Failed to get questions: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  // Build the payload expected by /exam/verdict from generic AI questions
  function buildVerdictPayload() {
    // gather interests from any multi/single whose selected items are known topics OR marked topic_tag
    const interests = new Set();
    // basic fields
    let goal = '';
    let hours = '';
    const self = { math: 0, programming: 0, study: 0 };
    const quiz = { math: false, data: false, cs: false };

    // simple helpers
    const coerceInt = (v, def=0) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? Math.max(0, Math.min(4, n)) : def;
    };
    const mapTopicTagToSelfKey = (tag='') => {
      const t = tag.toLowerCase();
      if (['cs','programming','web','systems','algorithms','robotics','quantum'].includes(t)) return 'programming';
      if (['math','stats','physics','economics'].includes(t)) return 'math';
      return 'study';
    };

    for (const q of questions) {
      const { id, type, options = [], topic_tag = '' } = q || {};
      const val = answers[id];

      if (val == null) continue;

      if (type === 'multi') {
        // val = array of strings
        const arr = Array.isArray(val) ? val : [val];
        for (const v of arr) {
          if (KNOWN_TOPICS.has(String(v).toLowerCase())) interests.add(String(v).toLowerCase());
        }
        // also accept topic_tag if provided and selected anything
        if (arr.length && topic_tag && KNOWN_TOPICS.has(String(topic_tag).toLowerCase())) {
          interests.add(String(topic_tag).toLowerCase());
        }
      } else if (type === 'single') {
        const sval = String(val);
        // crude detection of hours
        if (/\b(h|hours)\b/i.test(q.prompt || '') || /<2h|2–4h|5–7h|8–12h|13\+h/.test(options.join(','))) {
          hours = sval;
        }
        // crude detection of goal
        if (/goal|objective|aim/i.test(q.prompt || '')) {
          goal = sval;
        }
        // single topic selection may also be an interest
        if (KNOWN_TOPICS.has(sval.toLowerCase())) interests.add(sval.toLowerCase());
      } else if (type === 'scale') {
        // val should be a number 0..4
        const key = mapTopicTagToSelfKey(topic_tag);
        self[key] = coerceInt(val, 0);
      } else if (type === 'quiz') {
        // val = selected option; mark correctness if equals q.correct
        const correct = (q.correct || '').toString();
        const isRight = String(val) === correct;
        const k = (topic_tag || '').toLowerCase();
        if (k === 'math') quiz.math = isRight;
        else if (k === 'data' || k === 'stats') quiz.data = isRight;
        else if (k === 'cs') quiz.cs = isRight;
      } else if (type === 'short') {
        // ignore for scoring; could be language/budget/etc.
      }
    }

    const interestsArr = Array.from(interests);
    return {
      answers: {
        interests: interestsArr,
        top3: interestsArr.slice(0, 3),
        goal,
        hours,
        self,
        quiz
      },
      questions: questions,
      answers: answers,
      // Pass the original seed interests for topic-specific advisor generation
      seed_interests: seedInterests,
      // These will be generated by Python based on user interests
      advisor_description: "",
      conversation_transcript: "",
      skill_levels: []
    };
  }

  async function submitVerdict(e) {
    e?.preventDefault?.();
    setLoading(true); setError(null); setVerdict(null);
    try {
      const payload = buildVerdictPayload();
      const res = await fetch(`${API_BASE}/verdict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setVerdict(data.output || data); // {summary, recommendations, rationales?}
    } catch (err) {
      setError(`Failed to get verdict: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  // render helpers
  const updateAnswer = (id, value, kind) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (kind === 'multi') {
        const curr = new Set(Array.isArray(prev[id]) ? prev[id] : []);
        if (curr.has(value)) curr.delete(value); else curr.add(value);
        next[id] = Array.from(curr);
      } else {
        next[id] = value;
      }
      return next;
    });
  };

  const renderQuestion = (q) => {
    const { id, prompt, type, options = [], scale } = q;
    const val = answers[id];

    if (type === 'multi') {
      return (
        <div key={id} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600 }}>{prompt}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {options.map(opt => (
              <label key={opt} style={{ border: '1px solid #ddd', padding: '4px 8px', borderRadius: 6 }}>
                <input
                  type="checkbox"
                  checked={(Array.isArray(val) ? val : []).includes(opt)}
                  onChange={() => updateAnswer(id, opt, 'multi')}
                />{' '}
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'single') {
      return (
        <div key={id} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600 }}>{prompt}</div>
          <select
            value={val || ''}
            onChange={(e) => updateAnswer(id, e.target.value)}
            style={{ padding: 6, marginTop: 6 }}
          >
            <option value="" disabled>Select…</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    }

    if (type === 'scale') {
      const [min=0, max=4, lmin='Low', lmax='High'] = Array.isArray(scale) ? scale : [0,4,'Low','High'];
      return (
        <div key={id} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600 }}>{prompt}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ opacity: .7 }}>{lmin}</span>
            <input
              type="range" min={min} max={max} step={1}
              value={val ?? Math.round((min+max)/2)}
              onChange={(e) => updateAnswer(id, Number(e.target.value))}
            />
            <span style={{ opacity: .7 }}>{lmax}</span>
            <span style={{ fontFamily: 'monospace' }}>{val ?? Math.round((min+max)/2)}</span>
          </div>
        </div>
      );
    }

    if (type === 'quiz') {
      return (
        <div key={id} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600 }}>{prompt}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            {options.map(opt => (
              <label key={opt} style={{ border: '1px solid #ddd', padding: '4px 8px', borderRadius: 6 }}>
                <input
                  type="radio" name={id} value={opt}
                  checked={val === opt}
                  onChange={() => updateAnswer(id, opt)}
                />{' '}
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }

    // short (free text)
    return (
      <div key={id} style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600 }}>{prompt}</div>
        <input
          type="text"
          value={val || ''}
          onChange={(e) => updateAnswer(id, e.target.value)}
          placeholder="Type your answer"
          style={{ width: 360, padding: 8, marginTop: 6 }}
        />
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'sans-serif', margin: '2rem', maxWidth: 800 }}>
      <h1>Personalized Course Finder</h1>

      <form onSubmit={fetchQuestions} style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>Interests hint (optional):</label>
        <input
          type="text"
          value={seedInterests}
          onChange={(e) => setSeedInterests(e.target.value)}
          placeholder="e.g. ml,data,cs"
          style={{ width: 260, padding: 8, marginRight: 10 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Generating…' : 'Generate Questions'}
        </button>
      </form>

      {questions.length > 0 && (
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, marginTop: 12 }}>
          <h2 style={{ marginTop: 0 }}>Answer these</h2>
          {questions.map(renderQuestion)}
          <button onClick={submitVerdict} disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Submitting…' : 'Get Recommendations'}
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: 'red', marginTop: 16 }}>Error: {error}</p>
      )}

      {verdict && (
        <div style={{ marginTop: 24 }}>
          <h2>Recommendations</h2>
          {verdict.summary && (
            <div style={{ marginBottom: 12 }}>
              <div><strong>Primary topics:</strong> {(verdict.summary.primary_topics || []).join(', ')}</div>
              <div><strong>Study time:</strong> {verdict.summary.study_time}</div>
              {verdict.summary.estimated_levels && (
                <div>
                  <strong>Estimated levels:</strong>{' '}
                  <code>{JSON.stringify(verdict.summary.estimated_levels)}</code>
                </div>
              )}
            </div>
          )}

          {/* Display Questions and Answers */}
          {verdict.questions && verdict.questions.length > 0 && (
            <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Questions & Your Answers</h3>
              {verdict.questions.map((q, index) => {
                const answerKey = `q${index + 1}`;
                const userAnswer = verdict.answers && verdict.answers[answerKey];
                
                return (
                  <div key={q.id || index} style={{ marginBottom: 16, padding: 12, backgroundColor: 'white', borderRadius: 6, border: '1px solid #e9ecef' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#495057' }}>
                      Question {index + 1}: {q.prompt}
                    </div>
                    <div style={{ fontSize: '0.9em', marginBottom: 8, color: '#6c757d' }}>
                      <strong>Type:</strong> {q.type} | <strong>Topic:</strong> {q.topic_tag || 'general'}
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div style={{ fontSize: '0.9em', marginBottom: 8, color: '#6c757d' }}>
                        <strong>Options:</strong> {q.options.join(', ')}
                      </div>
                    )}
                    {q.scale && Array.isArray(q.scale) && (
                      <div style={{ fontSize: '0.9em', marginBottom: 8, color: '#6c757d' }}>
                        <strong>Scale:</strong> {q.scale[0]}-{q.scale[1]} ({q.scale[2]} to {q.scale[3]})
                      </div>
                    )}
                    {q.correct && (
                      <div style={{ fontSize: '0.9em', marginBottom: 8, color: '#6c757d' }}>
                        <strong>Correct Answer:</strong> {q.correct}
                      </div>
                    )}
                    <div style={{ 
                      padding: 8, 
                      backgroundColor: userAnswer ? '#d4edda' : '#f8d7da', 
                      borderRadius: 4,
                      border: `1px solid ${userAnswer ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                      <strong>Your Answer:</strong> {userAnswer ? (
                        Array.isArray(userAnswer) ? userAnswer.join(', ') : String(userAnswer)
                      ) : 'No answer provided'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <ul>
            {(verdict.recommendations || []).map(c => (
              <li key={c.id} style={{ marginBottom: 8 }}>
                <strong>{c.title}</strong> <small>({c.id})</small>
                {verdict.rationales && verdict.rationales[c.id] && (
                  <div style={{ opacity: .8 }}>{verdict.rationales[c.id]}</div>
                )}
              </li>
            ))}
          </ul>

          {/* Display Advisor Information */}
          {(verdict.advisor_description || verdict.conversation_transcript || verdict.skill_levels) && (
            <div style={{ marginTop: 24, padding: 16, backgroundColor: '#e3f2fd', borderRadius: 8, border: '1px solid #bbdefb' }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1976d2' }}>Advisor Information</h3>
              
              {verdict.advisor_description && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1565c0' }}>Advisor Description:</h4>
                  <div style={{ 
                    padding: 12, 
                    backgroundColor: 'white', 
                    borderRadius: 6, 
                    border: '1px solid #90caf9',
                    fontStyle: 'italic',
                    lineHeight: '1.5'
                  }}>
                    {verdict.advisor_description}
                  </div>
                </div>
              )}

              {verdict.conversation_transcript && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1565c0' }}>Conversation Transcript:</h4>
                  <div style={{ 
                    padding: 12, 
                    backgroundColor: 'white', 
                    borderRadius: 6, 
                    border: '1px solid #90caf9',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {verdict.conversation_transcript}
                  </div>
                </div>
              )}

              {verdict.skill_levels && Array.isArray(verdict.skill_levels) && verdict.skill_levels.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1565c0' }}>Skill Levels:</h4>
                  <div style={{ 
                    padding: 12, 
                    backgroundColor: 'white', 
                    borderRadius: 6, 
                    border: '1px solid #90caf9'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {verdict.skill_levels.map((skill, index) => (
                        <div key={index} style={{
                          padding: '6px 12px',
                          backgroundColor: '#f3e5f5',
                          borderRadius: 16,
                          border: '1px solid #ce93d8',
                          fontSize: '0.9em'
                        }}>
                          <strong>{skill[0]}:</strong> {skill[1]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Display Course Roadmap */}
          {(verdict.roadmap_vertices || verdict.roadmap_edges) && (
            <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f0f8ff', borderRadius: 8, border: '1px solid #b0e0e6' }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1e3a8a' }}>Course Roadmap</h3>
              
              {/* Interactive Graph Visualization */}
              {verdict.roadmap_vertices && verdict.roadmap_edges && (
                <div style={{ marginBottom: 20 }}>
                  <CourseGraph 
                    vertices={verdict.roadmap_vertices} 
                    edges={verdict.roadmap_edges} 
                  />
                </div>
              )}
              
              {/* Collapsible Raw Data Section */}
              <details style={{ marginBottom: 20 }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: '600', 
                  color: '#1d4ed8',
                  padding: '8px',
                  backgroundColor: '#e0f2fe',
                  borderRadius: '6px',
                  border: '1px solid #b3e5fc'
                }}>
                  📊 View Raw Data (JSON)
                </summary>
                
                <div style={{ marginTop: 12 }}>
                  {verdict.roadmap_vertices && (
                    <div style={{ marginBottom: 20 }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1d4ed8' }}>Vertices (Courses):</h4>
                      <div style={{ 
                        padding: 12, 
                        backgroundColor: 'white', 
                        borderRadius: 6, 
                        border: '1px solid #93c5fd',
                        fontFamily: 'monospace',
                        fontSize: '0.9em',
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap',
                        overflow: 'auto',
                        maxHeight: '300px'
                      }}>
                        {JSON.stringify(verdict.roadmap_vertices, null, 2)}
                      </div>
                    </div>
                  )}

                  {verdict.roadmap_edges && (
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1d4ed8' }}>Edges (Prerequisites):</h4>
                      <div style={{ 
                        padding: 12, 
                        backgroundColor: 'white', 
                        borderRadius: 6, 
                        border: '1px solid #93c5fd',
                        fontFamily: 'monospace',
                        fontSize: '0.9em',
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap',
                        overflow: 'auto',
                        maxHeight: '200px'
                      }}>
                        {JSON.stringify(verdict.roadmap_edges, null, 2)}
                      </div>
                    </div>
                  )}

                  {/* Print statements as requested */}
                  <div style={{ marginTop: 20, padding: 12, backgroundColor: '#fef3c7', borderRadius: 6, border: '1px solid #f59e0b' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '0.9em' }}>Debug Output:</h4>
                    <div style={{ 
                      fontFamily: 'monospace',
                      fontSize: '0.8em',
                      color: '#451a03',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {verdict.roadmap_vertices && `print(vertices)\n${JSON.stringify(verdict.roadmap_vertices, null, 2)}\n\n`}
                      {verdict.roadmap_edges && `print(edges)\n${JSON.stringify(verdict.roadmap_edges, null, 2)}`}
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Question;
