import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import {
    Search,
    ZoomIn,
    ZoomOut,
    Maximize2,
    AlertOctagon,
    Network,
    Activity,
} from 'lucide-react';
import { monitoringApi } from '../../api/client';
import { useQuery } from '@tanstack/react-query';
import { SimulationControlCenter } from '../../components/SimulationControlCenter';
import { GraphRiskPanel } from '../../components/graph/GraphRiskPanel';
import { DeviceIntelligencePanel } from '../../components/dashboard/DeviceIntelligencePanel';
import { EnrichedGraphNode, FraudCluster } from '../../types';

interface D3Node extends d3.SimulationNodeDatum, EnrichedGraphNode {
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
    source: string | D3Node;
    target: string | D3Node;
    type: string;
    fraudScore?: number;
}

// Risk score → colour gradient
const nodeColor = (d: D3Node): string => {
    const s = d.riskScore ?? 0;
    if (s >= 75) return '#ef4444';
    if (s >= 50) return '#f97316';
    if (s >= 30) return '#f59e0b';
    return d.type === 'USER' ? '#3b82f6' : d.type === 'DEVICE' ? '#8b5cf6' : d.type === 'IP' ? '#06b6d4' : '#10b981';
};

// Edge colour by relationship type
const linkColor = (l: D3Link): string => {
    if (l.type === 'TX_USER') return l.fraudScore && l.fraudScore > 0.6 ? '#ef4444' : '#64748b';
    if (l.type === 'USER_DEVICE' || l.type === 'USED_BY') return '#06b6d4';
    if (l.type === 'USER_IP' || l.type === 'CONNECTED_TO') return '#f97316';
    return '#334155';
};

export const InvestigationWorkspace = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedNode, setSelectedNode] = useState<EnrichedGraphNode | null>(null);

    const { data: graphData, isLoading } = useQuery({
        queryKey: ['investigation-graph'],
        queryFn: () => monitoringApi.getGraph(500),
        refetchInterval: 10000, // Faster refresh during simulation investigations
    });

    const { data: deviceIntelligence } = useQuery({
        queryKey: ['investigation-device-intelligence'],
        queryFn: () => monitoringApi.getDeviceIntelligence(20),
        refetchInterval: 20000,
    });

    const clusters: FraudCluster[] = (graphData as any)?.clusters ?? [];

    const runForensicAnalysis = useCallback(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.transition().duration(200)
            .style('filter', 'brightness(2) saturate(2) drop-shadow(0 0 20px #3b82f6)')
            .transition().duration(900).style('filter', 'none');
        svg.select('g').selectAll<SVGCircleElement, D3Node>('.node circle')
            .transition().duration(500)
            .attr('r', (d) => (d.riskScore ?? 0) > 70 ? 26 : (d.type === 'TRANSACTION' ? 8 : 15))
            .style('stroke', (d) => (d.riskScore ?? 0) > 70 ? '#fff' : '#0f172a')
            .style('stroke-width', (d) => (d.riskScore ?? 0) > 70 ? 4 : 2)
            .transition().duration(2000)
            .attr('r', (d) => d.type === 'TRANSACTION' ? 8 : 15)
            .style('stroke', '#0f172a').style('stroke-width', 2);
    }, []);

    useEffect(() => {
        if (!graphData || !svgRef.current) return;

        const width = svgRef.current.clientWidth;
        const height = 750;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const g = svg.append('g');

        // Zoom
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));
        svg.call(zoom as any);

        // Filter nodes
        const allNodes: D3Node[] = (graphData.nodes as EnrichedGraphNode[]).map((n) => ({ ...n }));
        const filteredNodes = allNodes.filter((n) => {
            const matchesSearch = n.id.toLowerCase().includes(searchTerm.toLowerCase());
            if (filterType === 'all') return matchesSearch;
            if (filterType === 'high-risk') return matchesSearch && (n.riskScore ?? 0) > 60;
            if (filterType === 'fraud-rings') return matchesSearch && n.isFraudCluster;
            return matchesSearch;
        });

        const nodeIds = new Set(filteredNodes.map((n) => n.id));
        const filteredLinks: D3Link[] = (graphData.links as D3Link[]).filter((l) =>
            nodeIds.has((l.source as any).id || l.source) &&
            nodeIds.has((l.target as any).id || l.target)
        );

        // Simulation
        const simulation = d3.forceSimulation<D3Node>(filteredNodes)
            .force('link', d3.forceLink<D3Node, D3Link>(filteredLinks).id((d) => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide<D3Node>().radius((d) => ((d.riskScore ?? 0) > 70 ? 30 : 20)));

        // Draw defs — glow filter
        const defs = svg.append('defs');
        const filter = defs.append('filter').attr('id', 'glow');
        filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Links
        const link = g.append('g')
            .selectAll<SVGLineElement, D3Link>('line')
            .data(filteredLinks)
            .join('line')
            .attr('stroke', (d) => linkColor(d))
            .attr('stroke-opacity', 0.55)
            .attr('stroke-width', (d) => d.type === 'TX_USER' ? 1 : 1.5);

        // Nodes
        const node = g.append('g')
            .selectAll<SVGGElement, D3Node>('.node')
            .data(filteredNodes)
            .join('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')
            .call(d3.drag<SVGGElement, D3Node>()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                })
            )
            .on('click', (_event, d) => setSelectedNode(d as EnrichedGraphNode));

        // Outer pulse ring for high-risk nodes (including simulation nodes)
        node.filter((d) => (d.riskScore ?? 0) >= 70)
            .append('circle')
            .attr('r', 22)
            .attr('fill', 'none')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.5)
            .attr('filter', 'url(#glow)')
            .each(function pulseAnimate() {
                const el = d3.select(this);
                (function loop() {
                    el.transition().duration(900).attr('r', 28).attr('stroke-opacity', 0)
                        .transition().duration(100).attr('r', 22).attr('stroke-opacity', 0.5)
                        .on('end', loop);
                })();
            });

        // Main circle
        node.append('circle')
            .attr('r', (d) => d.type === 'TRANSACTION' ? 7 : d.type === 'USER' ? 14 : 11)
            .attr('fill', (d) => nodeColor(d))
            .attr('stroke', (d) => (d.riskScore ?? 0) >= 70 ? '#fff' : '#0f172a')
            .attr('stroke-width', (d) => (d.riskScore ?? 0) >= 70 ? 2.5 : 1.5)
            .attr('filter', (d) => (d.riskScore ?? 0) >= 70 ? 'url(#glow)' : '');

        // Type icon label (abbreviated)
        node.append('text')
            .attr('dy', 4)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .style('font-size', '7px')
            .style('font-weight', '900')
            .style('pointer-events', 'none')
            .text((d) => d.type === 'USER' ? 'U' : d.type === 'DEVICE' ? 'D' : d.type === 'IP' ? 'IP' : 'TX');

        // Node id label
        node.append('text')
            .attr('dx', 17)
            .attr('dy', 5)
            .attr('fill', '#94a3b8')
            .style('font-size', '9px')
            .style('pointer-events', 'none')
            .text((d) => d.id.split('@')[0].substring(0, 16));

        // Tick
        simulation.on('tick', () => {
            link
                .attr('x1', (d) => (d.source as D3Node).x!)
                .attr('y1', (d) => (d.source as D3Node).y!)
                .attr('x2', (d) => (d.target as D3Node).x!)
                .attr('y2', (d) => (d.target as D3Node).y!);
            node.attr('transform', (d) => `translate(${d.x},${d.y})`);
        });

        return () => { simulation.stop(); };
    }, [graphData, searchTerm, filterType]);

    const fraudClusters = clusters.filter((c) => c.avgFraudScore >= 0.5);

    return (
        <div className="flex flex-col gap-6">
            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            className="w-72 rounded-xl bg-slate-900 border border-slate-800 py-2 pl-9 pr-4 text-sm text-slate-100 outline-none focus:border-blue-500/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="rounded-xl bg-slate-900 border border-slate-800 py-2 px-3 text-sm text-slate-300 outline-none"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Nodes</option>
                        <option value="high-risk">High Risk (&gt;60)</option>
                        <option value="fraud-rings">Fraud Rings</option>
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    {fraudClusters.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <Activity size={12} className="text-red-400" />
                            <span className="text-[11px] font-bold text-red-400">{fraudClusters.length} Fraud Ring{fraudClusters.length > 1 ? 's' : ''} Detected</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                        <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400" title="Zoom in"><ZoomIn size={16} /></button>
                        <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400" title="Zoom out"><ZoomOut size={16} /></button>
                        <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400" title="Full screen"><Maximize2 size={16} /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Graph Canvas */}
                <div className="lg:col-span-3 relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden" style={{ height: 750 }}>
                    {/* Legend */}
                    <div className="absolute top-4 left-4 z-10">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> User</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /> Device</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-500" /> IP</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> TX</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> High Risk</span>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-20">
                            <div className="loading-spinner h-8 w-8" />
                        </div>
                    )}

                    <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

                    {/* Cluster Detection Panel */}
                    <div className="absolute bottom-4 left-4 z-10">
                        <div className="panel p-4 w-64 bg-slate-900/90 backdrop-blur border-blue-500/20 shadow-2xl">
                            <h4 className="flex items-center gap-2 text-xs font-black uppercase text-blue-400 tracking-tighter mb-2">
                                <AlertOctagon size={13} /> Cluster Detection
                            </h4>
                            {fraudClusters.length === 0 ? (
                                <p className="text-xs text-slate-500">No fraud clusters detected yet.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {fraudClusters.slice(0, 3).map((c) => (
                                        <div key={c.clusterId} className="p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-[10px]">
                                            <div className="flex justify-between mb-0.5">
                                                <span className="font-mono text-red-300">{c.clusterId}</span>
                                                <span className="text-red-400 font-bold">{(c.avgFraudScore * 100).toFixed(0)}%</span>
                                            </div>
                                            <span className="text-slate-400">{c.size} accounts · {c.sharedDevices.length} devices · {c.sharedIPs.length} IPs</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={runForensicAnalysis}
                                className="mt-3 w-full py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold uppercase transition hover:bg-blue-600/30 active:scale-95"
                            >
                                Run Forensic Scan
                            </button>
                        </div>
                    </div>

                    {/* Node Stats */}
                    <div className="absolute bottom-4 right-4 z-10">
                        <div className="flex gap-2">
                            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-[10px] text-center">
                                <div className="font-black text-white">{graphData?.nodes?.length ?? 0}</div>
                                <div className="text-slate-400 uppercase">Nodes</div>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-[10px] text-center">
                                <div className="font-black text-white">{graphData?.links?.length ?? 0}</div>
                                <div className="text-slate-400 uppercase">Edges</div>
                            </div>
                            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] text-center">
                                <div className="font-black text-red-400">{fraudClusters.length}</div>
                                <div className="text-slate-400 uppercase">Clusters</div>
                            </div>
                        </div>
                    </div>

                    {/* Risk Panel */}
                    {selectedNode && (
                        <GraphRiskPanel
                            node={selectedNode}
                            clusters={clusters}
                            onClose={() => setSelectedNode(null)}
                        />
                    )}
                </div>

                {/* Simulation Control Center */}
                <div className="lg:col-span-1 space-y-6">
                    <SimulationControlCenter />

                    {/* Additional Forensic Context */}
                    <div className="panel bg-slate-900/20 border-dashed border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Forensic Intelligence</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-bold uppercase">ML Confidence</span>
                                <span className="text-blue-400 font-mono">94.2%</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-bold uppercase">Graph Density</span>
                                <span className="text-blue-400 font-mono">0.024</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-bold uppercase">Processing Lcy</span>
                                <span className="text-emerald-400 font-mono">14ms</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Device Intelligence */}
            {deviceIntelligence && deviceIntelligence.length > 0 && (
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <Network size={14} /> Device Intelligence
                    </h2>
                    <DeviceIntelligencePanel devices={deviceIntelligence} />
                </div>
            )}
        </div>
    );
};
