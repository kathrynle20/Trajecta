import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const PeopleGraph = ({ vertices, edges, currentUserId, top5Closest, onUserClick }) => {
  const svgRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!vertices || !edges || vertices.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1200;
    const height = 700;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a force simulation
    const simulation = d3.forceSimulation(vertices)
      .force("link", d3.forceLink(edges).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Define color scale for similarity
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, 1]);

    // Add links (edges)
    const link = g.append("g")
      .selectAll("line")
      .data(edges)
      .enter().append("line")
      .attr("stroke", d => colorScale(d.similarity))
      .attr("stroke-width", d => Math.max(1, d.similarity * 5))
      .attr("stroke-opacity", 0.7);

    // Add nodes (users)
    const node = g.append("g")
      .selectAll("g")
      .data(vertices)
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add circles for users
    node.append("circle")
      .attr("r", d => d.is_current_user ? 35 : 25)
      .attr("fill", d => d.is_current_user ? "#ff6b6b" : "#4dabf7")
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .attr("opacity", 0.9);

    // Add user avatars (if available)
    node.append("image")
      .attr("xlink:href", d => d.avatar_url || "")
      .attr("x", d => d.is_current_user ? -30 : -20)
      .attr("y", d => d.is_current_user ? -30 : -20)
      .attr("width", d => d.is_current_user ? 60 : 40)
      .attr("height", d => d.is_current_user ? 60 : 40)
      .attr("clip-path", d => d.is_current_user ? "circle(30px at center)" : "circle(20px at center)")
      .style("opacity", d => d.avatar_url ? 1 : 0);

    // Add user initials for those without avatars
    node.append("text")
      .text(d => {
        if (d.avatar_url) return "";
        const name = d.name || d.email;
        return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
      })
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", d => d.is_current_user ? "14px" : "12px")
      .attr("font-weight", "bold");

    // Add user names below nodes
    node.append("text")
      .text(d => {
        const name = d.name || d.email;
        return name.length > 15 ? name.substring(0, 12) + "..." : name;
      })
      .attr("text-anchor", "middle")
      .attr("dy", d => d.is_current_user ? "45px" : "35px")
      .attr("fill", "#1a1a1a")
      .attr("font-size", "12px")
      .attr("font-weight", "600");

    // Add click handlers for user details
    node.on("click", function(event, d) {
      setSelectedUser(d);
      setShowModal(true);
      if (onUserClick) onUserClick(d);
    });

    // Add hover effects
    node.on("mouseover", function(event, d) {
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", d => d.is_current_user ? 40 : 30)
        .attr("stroke-width", 4);
    });

    node.on("mouseout", function(event, d) {
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", d => d.is_current_user ? 35 : 25)
        .attr("stroke-width", 3);
    });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      // Keep nodes within bounds
      vertices.forEach(d => {
        d.x = Math.max(40, Math.min(innerWidth - 40, d.x));
        d.y = Math.max(40, Math.min(innerHeight - 40, d.y));
      });

      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(20, 20)`);

    legend.append("circle")
      .attr("r", 15)
      .attr("fill", "#ff6b6b")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    legend.append("text")
      .attr("x", 25)
      .attr("y", 5)
      .text("You")
      .attr("font-size", "12px")
      .attr("font-weight", "600");

    legend.append("circle")
      .attr("cy", 30)
      .attr("r", 12)
      .attr("fill", "#4dabf7")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    legend.append("text")
      .attr("x", 25)
      .attr("y", 35)
      .text("Other Users")
      .attr("font-size", "12px")
      .attr("font-weight", "600");

  }, [vertices, edges, currentUserId]);

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'auto', maxWidth: '100%' }}>
      <div style={{ overflow: 'auto', width: '100%', maxWidth: '100%' }}>
        <svg ref={svgRef}></svg>
      </div>

      {/* Top 5 Closest People List */}
      {top5Closest && top5Closest.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '1.1rem' }}>
            🎯 Top 5 Most Similar Users
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {top5Closest.map((item, index) => (
              <div key={item.user_id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px',
                background: '#f8fafc',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => {
                setSelectedUser(item.user);
                setShowModal(true);
              }}
              >
                <div style={{
                  minWidth: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                </div>
                {item.user.avatar_url ? (
                  <img 
                    src={item.user.avatar_url} 
                    alt={item.user.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#6b7280',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {(item.user.name || item.user.email).split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>
                    {item.user.name || item.user.email}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Similarity: {(item.similarity * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={closeModal}
        >
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}
          onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              {selectedUser.avatar_url ? (
                <img 
                  src={selectedUser.avatar_url} 
                  alt={selectedUser.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {(selectedUser.name || selectedUser.email).split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>
                  {selectedUser.name || selectedUser.email}
                  {selectedUser.is_current_user && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '0.8rem', 
                      background: '#ef4444', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '12px' 
                    }}>
                      You
                    </span>
                  )}
                </h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                  {selectedUser.email}
                </p>
              </div>
            </div>

            {selectedUser.bio && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Bio</h4>
                <p style={{ margin: 0, color: '#374151', lineHeight: '1.5' }}>
                  {selectedUser.bio}
                </p>
              </div>
            )}

            {selectedUser.interests && selectedUser.interests.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Interests & Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedUser.interests.map((interest, index) => (
                    <span key={index} style={{
                      background: '#e0f2fe',
                      color: '#0277bd',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedUser.created_at && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Member Since</h4>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                  {new Date(selectedUser.created_at).toLocaleDateString()}
                </p>
              </div>
            )}

            <button
              onClick={closeModal}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleGraph;
