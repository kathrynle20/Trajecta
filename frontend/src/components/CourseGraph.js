import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const CourseGraph = ({ vertices, edges }) => {
  const svgRef = useRef();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    if (!vertices || !edges || vertices.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1000;
    const height = 600;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);

    // Create a container group for proper margins
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Process data
    const nodes = vertices.map((vertex, index) => ({
      id: vertex[0],
      name: vertex[0],
      description: vertex[1],
      index: index,
      x: Math.random() * innerWidth * 0.6 + innerWidth * 0.2,
      y: Math.random() * innerHeight * 0.6 + innerHeight * 0.2
    }));

    const links = edges.map(edge => ({
      source: edge[0],
      target: edge[1]
    }));

    // Create simulation with tighter forces
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(80).strength(0.8))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force("collision", d3.forceCollide().radius(35))
      .force("x", d3.forceX(innerWidth / 2).strength(0.1))
      .force("y", d3.forceY(innerHeight / 2).strength(0.1));

    // Add arrow markers
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#666");

    // Add links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#666")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)")
      .attr("stroke-opacity", 0.6);

    // Add nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add circles for nodes
    node.append("circle")
      .attr("r", 25)
      .attr("fill", d => {
        // Color coding based on course type
        const name = d.name.toLowerCase();
        if (name.includes('probability') || name.includes('statistics')) return "#ff6b6b";
        if (name.includes('programming') || name.includes('python')) return "#4ecdc4";
        if (name.includes('machine learning') || name.includes('deep learning')) return "#45b7d1";
        if (name.includes('optimization') || name.includes('convex')) return "#f9ca24";
        if (name.includes('vision') || name.includes('nlp')) return "#6c5ce7";
        return "#a0a0a0";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))")
      .on("click", function(event, d) {
        setSelectedCourse(d);
        setShowDescription(true);
      })
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 30)
          .attr("stroke-width", 4);
        
        // Show tooltip positioned relative to the container
        const tooltip = g.append("g")
          .attr("id", "tooltip")
          .attr("transform", `translate(${Math.min(d.x + 35, innerWidth - 220)}, ${Math.max(d.y - 10, 20)})`);

        tooltip.append("rect")
          .attr("width", 220)
          .attr("height", 35)
          .attr("fill", "rgba(0, 0, 0, 0.9)")
          .attr("rx", 5)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);

        tooltip.append("text")
          .attr("x", 10)
          .attr("y", 23)
          .attr("fill", "white")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .text(d.name.length > 30 ? d.name.substring(0, 30) + "..." : d.name);
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 25)
          .attr("stroke-width", 3);
        g.select("#tooltip").remove();
      });

    // Add labels with better text handling
    node.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "black")
      .attr("stroke", "white")
      .attr("stroke-width", "2")
      .attr("paint-order", "stroke")
      .style("pointer-events", "none")
      .text(d => {
        // Better abbreviation logic
        const words = d.name.split(" ");
        if (words.length > 3) {
          return words.slice(0, 2).join(" ") + "...";
        } else if (d.name.length > 18) {
          return d.name.substring(0, 15) + "...";
        }
        return d.name.length > 15 ? d.name.substring(0, 15) : d.name;
      });

    // Update positions on simulation tick with boundary constraints
    simulation.on("tick", () => {
      // Constrain nodes to stay within boundaries
      nodes.forEach(d => {
        d.x = Math.max(30, Math.min(innerWidth - 30, d.x));
        d.y = Math.max(30, Math.min(innerHeight - 30, d.y));
      });

      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      // Constrain dragging to stay within boundaries
      d.fx = Math.max(30, Math.min(innerWidth - 30, event.x));
      d.fy = Math.max(30, Math.min(innerHeight - 30, event.y));
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [vertices, edges]);

  const closeDescription = () => {
    setShowDescription(false);
    setSelectedCourse(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <strong style={{ color: '#333' }}>📚 Interactive Course Roadmap</strong>
          <div style={{ fontSize: '12px', color: '#666' }}>
            💡 Click nodes for details • 🖱️ Drag to rearrange • 🔍 Hover for course names
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>Color Legend:</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#ff6b6b', borderRadius: '50%', marginRight: '4px' }}></span>Probability/Stats</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#4ecdc4', borderRadius: '50%', marginRight: '4px' }}></span>Programming</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#45b7d1', borderRadius: '50%', marginRight: '4px' }}></span>Machine Learning</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#f9ca24', borderRadius: '50%', marginRight: '4px' }}></span>Optimization</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#6c5ce7', borderRadius: '50%', marginRight: '4px' }}></span>AI Applications</span>
          <span><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#a0a0a0', borderRadius: '50%', marginRight: '4px' }}></span>Other</span>
        </div>
      </div>
      
      <div style={{ 
        border: '2px solid #ddd', 
        borderRadius: '12px', 
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <svg ref={svgRef} style={{ display: 'block' }}></svg>
      </div>

      {/* Course Description Modal */}
      {showDescription && selectedCourse && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            margin: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#333',
                lineHeight: '1.4',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                {selectedCourse.name}
              </h3>
              <button
                onClick={closeDescription}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  marginLeft: '16px',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              color: '#555',
              lineHeight: '1.6',
              fontSize: '14px'
            }}>
              {selectedCourse.description || 'No description available.'}
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={closeDescription}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseGraph;
