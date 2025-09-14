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
    <div style={{ 
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      margin: '1rem auto',
      maxWidth: 1400,
      padding: '0 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        color: '#1a1a1a'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          margin: '0 0 2rem 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textAlign: 'center'
        }}>Personalized Course Finder</h1>

      <form onSubmit={fetchQuestions} style={{ 
        marginBottom: 24, 
        padding: 20, 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <label style={{ 
          marginRight: 12, 
          fontWeight: '600', 
          color: '#374151',
          fontSize: '1.1rem'
        }}>Interests hint (optional):</label>
        <input
          type="text"
          value={seedInterests}
          onChange={(e) => setSeedInterests(e.target.value)}
          placeholder="e.g. ml,data,cs"
          style={{ 
            width: 300, 
            padding: '12px 16px', 
            marginRight: 12,
            borderRadius: '10px',
            border: '2px solid #e5e7eb',
            fontSize: '1rem',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#667eea';
            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.boxShadow = 'none';
          }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }
          }}
        >
          {loading ? 'Generating…' : 'Generate Questions'}
        </button>
      </form>

      {questions.length > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '20px', 
          padding: '24px', 
          marginTop: 20,
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: 20,
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#1e40af',
            textAlign: 'center'
          }}>Assessment Questions</h2>
          {questions.map(renderQuestion)}
          <button 
            onClick={submitVerdict} 
            disabled={loading} 
            style={{ 
              marginTop: 20,
              padding: '14px 28px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              display: 'block',
              margin: '20px auto 0',
              minWidth: '200px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }
            }}
          >
            {loading ? 'Submitting…' : 'Get Recommendations'}
          </button>
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: 20, 
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          borderRadius: '12px',
          border: '1px solid #fca5a5',
          color: '#dc2626',
          fontWeight: '600'
        }}>
          ⚠️ Error: {error}
        </div>
      )}

      {verdict && (
        <div style={{ 
          marginTop: 32,
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#166534',
            textAlign: 'center',
            margin: '0 0 24px 0',
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Recommendations</h2>
          {verdict.summary && (
            <div style={{ 
              marginBottom: 20, 
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '12px',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <div style={{ 
                fontSize: '1.1rem', 
                marginBottom: 8, 
                color: '#374151',
                fontWeight: '600'
              }}>
                <strong style={{ color: '#16a34a' }}>Primary topics:</strong> {(verdict.summary.primary_topics || []).join(', ')}
              </div>
              <div style={{ 
                fontSize: '1.1rem', 
                marginBottom: 8, 
                color: '#374151',
                fontWeight: '600'
              }}>
                <strong style={{ color: '#16a34a' }}>Study time:</strong> {verdict.summary.study_time}
              </div>
              {verdict.summary.estimated_levels && (
                <div style={{ 
                  fontSize: '1.1rem', 
                  color: '#374151',
                  fontWeight: '600'
                }}>
                  <strong style={{ color: '#16a34a' }}>Estimated levels:</strong>{' '}
                  <code style={{ 
                    background: '#f3f4f6', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    color: '#1f2937',
                    fontSize: '0.9rem'
                  }}>{JSON.stringify(verdict.summary.estimated_levels)}</code>
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
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '16px',
            marginTop: '20px'
          }}>
            {(verdict.recommendations || []).map(c => (
              <div key={c.id} style={{ 
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  marginBottom: '4px'
                }}>
                  {c.title}
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#6b7280',
                  marginBottom: '8px'
                }}>
                  ({c.id})
                </div>
                {verdict.rationales && verdict.rationales[c.id] && (
                  <div style={{ 
                    fontSize: '0.95rem',
                    color: '#374151',
                    lineHeight: '1.5',
                    fontStyle: 'italic'
                  }}>
                    {verdict.rationales[c.id]}
                  </div>
                )}
              </div>
            ))}
          </div>

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
    </div>
  );
};

export default Question;
