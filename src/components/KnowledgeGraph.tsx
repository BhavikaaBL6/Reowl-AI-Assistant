import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { motion } from "motion/react";
import { Share2, Maximize2, ZoomIn, ZoomOut, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { isDemoMode, db } from "../lib/firebase";
import { getGeminiModel } from "../lib/gemini";
import { useFirebase } from "../contexts/FirebaseContext";
import { collection, query, limit, onSnapshot } from "firebase/firestore";

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  size: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
}

const data = {
  nodes: [
    { id: "Math", group: 1, label: "Mathematics", size: 40 },
    { id: "Physics", group: 2, label: "Physics", size: 38 },
    { id: "CS", group: 3, label: "Computer Science", size: 35 },
    { id: "Calc", group: 1, label: "Calculus III", size: 20 },
    { id: "Stats", group: 1, label: "Statistics", size: 20 },
    { id: "Linalg", group: 1, label: "Linear Algebra", size: 25 },
    { id: "Quantum", group: 2, label: "Quantum Mechanics", size: 25 },
    { id: "Relativity", group: 2, label: "Relativity", size: 20 },
    { id: "Algo", group: 3, label: "Algorithms", size: 25 },
    { id: "AI", group: 3, label: "Artificial Intelligence", size: 22 },
    { id: "OS", group: 3, label: "Operating Systems", size: 20 },
    { id: "Note1", group: 3, label: "Neural Networks", size: 15 },
    { id: "Note2", group: 1, label: "Matrix Operations", size: 15 },
  ],
  links: [
    { source: "Math", target: "Calc", value: 5 },
    { source: "Math", target: "Stats", value: 5 },
    { source: "Math", target: "Linalg", value: 5 },
    { source: "Physics", target: "Relativity", value: 5 },
    { source: "Physics", target: "Quantum", value: 5 },
    { source: "CS", target: "Algo", value: 5 },
    { source: "CS", target: "AI", value: 5 },
    { source: "CS", target: "OS", value: 5 },
    { source: "Math", target: "Physics", value: 8 },
    { source: "Math", target: "CS", value: 8 },
    { source: "AI", target: "Note1", value: 3 },
    { source: "Linalg", target: "Note2", value: 3 },
    { source: "Linalg", target: "AI", value: 6 },
    { source: "Calc", target: "Physics", value: 6 },
  ]
};

export const KnowledgeGraph = () => {
  const { user } = useFirebase();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = React.useState(data);
  const [isScanning, setIsScanning] = React.useState(false);

  useEffect(() => {
    if (!user || isDemoMode) return;

    // Fetch tasks to create subject/topic nodes
    const qTasks = query(collection(db!, "users", user.uid, "tasks"), limit(30));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const taskNodes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          group: data.priority === 'High' ? 1 : 2,
          label: data.title,
          size: data.priority === 'High' ? 30 : 20
        };
      });

      if (taskNodes.length > 0) {
        setGraphData(prev => {
          const existingIds = new Set(prev.nodes.map(n => n.id));
          const newNodes = taskNodes.filter(n => !existingIds.has(n.id));
          
          // Create some logical links based on subject/categories if available
          const newLinks = newNodes.slice(0, 10).map((n, i) => ({
            source: n.id,
            target: prev.nodes[Math.floor(Math.random() * prev.nodes.length)].id,
            value: 2
          }));

          return {
            nodes: [...prev.nodes, ...newNodes].slice(0, 50),
            links: [...prev.links, ...newLinks].slice(0, 100)
          };
        });
      }
    });

    return () => unsubscribeTasks();
  }, [user]);

  const scanConnections = async () => {
    setIsScanning(true);
    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const newLink = { source: "Quantum", target: "Calc", value: 4 };
        setGraphData(prev => ({
          ...prev,
          links: [...prev.links, newLink]
        }));
        return;
      }

      const prompt = `Given these conceptual nodes: ${JSON.stringify(graphData.nodes.map(n => ({ id: n.id, label: n.label })))}, identify one deep conceptual connection between two nodes that isn't already linked. Return a JSON object with { sourceNodeId, targetNodeId, correlationValue (1-10), explanation }. Ensure you use the provided 'id' for sourceNodeId and targetNodeId.`;
      
      const model = getGeminiModel({
        model: "gemini-3-flash-preview",
      });

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text || "{}");
      
      // Verify node IDs exist before adding the link
      const nodeIds = new Set(graphData.nodes.map(n => n.id));
      if (data.sourceNodeId && data.targetNodeId && nodeIds.has(data.sourceNodeId) && nodeIds.has(data.targetNodeId)) {
        const newLink = { source: data.sourceNodeId, target: data.targetNodeId, value: data.correlationValue };
        setGraphData(prev => ({
          ...prev,
          links: [...prev.links, newLink]
        }));
      } else if (data.sourceNodeId && data.targetNodeId) {
        console.warn("AI generated invalid node IDs:", data.sourceNodeId, data.targetNodeId);
      }
    } catch (error) {
      console.error("Neural scan failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<Node>(graphData.nodes as Node[])
      .force("link", d3.forceLink<Node, Link>(graphData.links as Link[]).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => (d as Node).size + 10));

    const link = g.append("g")
      .attr("stroke", "rgba(94, 92, 230, 0.2)")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt((d as any).value || 1));

    const node = g.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", (d: any) => d.size)
      .attr("fill", (d: any) => {
        const colors = ["#5E5CE6", "#FF9F0A", "#30D158", "#BF5AF2"];
        return colors[d.group % colors.length];
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-all duration-300 hover:brightness-110");

    node.append("text")
      .text((d: any) => d.label)
      .attr("x", 0)
      .attr("y", (d: any) => d.size + 15)
      .attr("text-anchor", "middle")
      .attr("class", "text-[10px] font-bold fill-neutral-600 uppercase tracking-widest pointer-events-none")
      .style("font-family", "Inter, sans-serif");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => (d.source as any).x)
        .attr("y1", (d: any) => (d.source as any).y)
        .attr("x2", (d: any) => (d.target as any).x)
        .attr("y2", (d: any) => (d.target as any).y);

      node
        .attr("transform", (d: any) => `translate(${(d as any).x},${(d as any).y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-ink mb-2 tracking-tight">Knowledge Constellation</h2>
          <p className="text-ink-muted font-light">Explore the neural connections between your subjects and notes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 glass hover:bg-white/20 rounded-2xl text-ink-muted transition-all">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button className="p-3 glass hover:bg-white/20 rounded-2xl text-ink-muted transition-all">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button className="p-3 glass hover:bg-white/20 rounded-2xl text-ink-muted transition-all">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 flex items-center gap-2 hover:scale-105 transition-all">
            <Maximize2 className="w-4 h-4" /> Go Fullscreen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[3rem] overflow-hidden relative border-white/60 shadow-2xl h-[600px]"
            ref={containerRef}
          >
            <svg ref={svgRef} className="w-full h-full" />
            
            <div className="absolute bottom-8 left-8 flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-[10px] font-bold border border-white">
                <div className="w-2 h-2 rounded-full bg-[#FF9F0A]" /> Mathematics
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-[10px] font-bold border border-white">
                <div className="w-2 h-2 rounded-full bg-[#30D158]" /> CS
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-[10px] font-bold border border-white">
                <div className="w-2 h-2 rounded-full bg-[#BF5AF2]" /> Physics
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
          <div className="glass p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-bold text-ink flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" /> Active Nodes
            </h3>
            <div className="space-y-4">
              {[
                { label: "Linear Algebra", type: "Subject", desc: "Foundational for AI" },
                { label: "Neural Networks", type: "Note", desc: "Created 2 days ago" },
                { label: "Algorithms", type: "Subject", desc: "Performance study" }
              ].map((node, i) => (
                <div key={i} className="group p-4 rounded-2xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{node.type}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <h4 className="font-bold text-ink text-sm group-hover:text-primary transition-colors">{node.label}</h4>
                  <p className="text-[10px] text-ink-muted mt-1">{node.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 via-primary to-purple-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
            <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
              {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Neural Link Scan
            </h4>
            <p className="text-white/70 text-xs leading-relaxed font-light mb-6">
              {isScanning 
                ? "Reo is analyzing deep correlations between your notes..." 
                : "Discover hidden connections between your subjects using Reo's relational intelligence."}
            </p>
            <button 
              onClick={scanConnections}
              disabled={isScanning}
              className="w-full py-3 bg-white text-primary font-bold rounded-2xl hover:bg-white/80 transition-colors disabled:opacity-50"
            >
              {isScanning ? "Scanning Neural Paths..." : "Scan for Connections"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
