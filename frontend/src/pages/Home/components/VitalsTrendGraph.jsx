import { useMemo, useState } from "react";

const VITAL_CONFIG = {
    heartRate: { label: "Heart Rate", color: "#ef4444", unit: "bpm" },
    oxygenSaturation: { label: "O₂ Sat", color: "#10b981", unit: "%" },
    respiratoryRate: { label: "Resp Rate", color: "#f59e0b", unit: "/min" },
    temperature: { label: "Temp", color: "#8b5cf6", unit: "°F" },
    systolic: { label: "BP Systolic", color: "#3b82f6", unit: "mmHg" },
    diastolic: { label: "BP Diastolic", color: "#60a5fa", unit: "mmHg" },
};

const GRAPH_HEIGHT = 180;
const GRAPH_PADDING = { top: 20, right: 20, bottom: 30, left: 50 };

function VitalsTrendGraph({ history = [], selectedVitals = ["heartRate", "oxygenSaturation"] }) {
    const [hiddenVitals, setHiddenVitals] = useState(new Set());
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const normalizedData = useMemo(() => {
        return history.map((entry) => {
            const vitals = entry.vitals || {};
            return {
                tick: entry.tick,
                heartRate: vitals.heartRate,
                oxygenSaturation: vitals.oxygenSaturation,
                respiratoryRate: vitals.respiratoryRate,
                temperature: vitals.temperature,
                systolic: vitals.bloodPressure?.systolic,
                diastolic: vitals.bloodPressure?.diastolic,
            };
        });
    }, [history]);

    const { minY, maxY, minX, maxX } = useMemo(() => {
        let min = Infinity;
        let max = -Infinity;
        let xMin = Infinity;
        let xMax = -Infinity;

        normalizedData.forEach((entry) => {
            xMin = Math.min(xMin, entry.tick);
            xMax = Math.max(xMax, entry.tick);
            selectedVitals.forEach((vital) => {
                if (hiddenVitals.has(vital)) return;
                const value = entry[vital];
                if (typeof value === "number" && !Number.isNaN(value)) {
                    min = Math.min(min, value);
                    max = Math.max(max, value);
                }
            });
        });

        const padding = (max - min) * 0.1 || 10;
        return {
            minY: Math.floor(min - padding),
            maxY: Math.ceil(max + padding),
            minX: xMin,
            maxX: xMax,
        };
    }, [normalizedData, selectedVitals, hiddenVitals]);

    const toggleVital = (vital) => {
        setHiddenVitals((prev) => {
            const next = new Set(prev);
            if (next.has(vital)) {
                next.delete(vital);
            } else {
                next.add(vital);
            }
            return next;
        });
    };

    if (normalizedData.length < 2) {
        return null;
    }

    const graphWidth = 500;
    const innerWidth = graphWidth - GRAPH_PADDING.left - GRAPH_PADDING.right;
    const innerHeight = GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom;

    const scaleX = (tick) => {
        if (maxX === minX) return GRAPH_PADDING.left + innerWidth / 2;
        return GRAPH_PADDING.left + ((tick - minX) / (maxX - minX)) * innerWidth;
    };

    const scaleY = (value) => {
        if (maxY === minY) return GRAPH_PADDING.top + innerHeight / 2;
        return GRAPH_PADDING.top + (1 - (value - minY) / (maxY - minY)) * innerHeight;
    };

    const renderLine = (vital) => {
        if (hiddenVitals.has(vital)) return null;
        const config = VITAL_CONFIG[vital];
        if (!config) return null;

        const points = normalizedData
            .filter((d) => typeof d[vital] === "number" && !Number.isNaN(d[vital]))
            .map((d) => `${scaleX(d.tick)},${scaleY(d[vital])}`)
            .join(" ");

        if (!points) return null;

        return (
            <polyline
                key={vital}
                points={points}
                fill="none"
                stroke={config.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        );
    };

    const renderDataPoints = (vital) => {
        if (hiddenVitals.has(vital)) return null;
        const config = VITAL_CONFIG[vital];
        if (!config) return null;

        return normalizedData
            .filter((d) => typeof d[vital] === "number" && !Number.isNaN(d[vital]))
            .map((d, index) => (
                <circle
                    key={`${vital}-${index}`}
                    cx={scaleX(d.tick)}
                    cy={scaleY(d[vital])}
                    r="4"
                    fill={config.color}
                    stroke="#fff"
                    strokeWidth="1"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredPoint({ ...d, vital })}
                    onMouseLeave={() => setHoveredPoint(null)}
                />
            ));
    };

    const yTicks = [];
    const yTickCount = 5;
    for (let i = 0; i <= yTickCount; i++) {
        const value = minY + ((maxY - minY) * i) / yTickCount;
        yTicks.push(value);
    }

    const xTicks = [];
    const tickRange = maxX - minX;
    const xTickStep = Math.max(1, Math.ceil(tickRange / 8));
    for (let t = minX; t <= maxX; t += xTickStep) {
        xTicks.push(t);
    }
    if (xTicks[xTicks.length - 1] !== maxX) {
        xTicks.push(maxX);
    }

    return (
        <div className="vitals-trend-container">
            <div className="vitals-legend">
                {selectedVitals.map((vital) => {
                    const config = VITAL_CONFIG[vital];
                    if (!config) return null;
                    const isHidden = hiddenVitals.has(vital);
                    return (
                        <button
                            key={vital}
                            type="button"
                            className={`legend-item ${isHidden ? "hidden" : ""}`}
                            onClick={() => toggleVital(vital)}
                            style={{ borderColor: config.color }}
                        >
                            <span
                                className="legend-color"
                                style={{ backgroundColor: isHidden ? "transparent" : config.color }}
                            />
                            {config.label}
                        </button>
                    );
                })}
            </div>

            <svg
                viewBox={`0 0 ${graphWidth} ${GRAPH_HEIGHT}`}
                className="vitals-graph-svg"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Y-axis */}
                <line
                    x1={GRAPH_PADDING.left}
                    y1={GRAPH_PADDING.top}
                    x2={GRAPH_PADDING.left}
                    y2={GRAPH_HEIGHT - GRAPH_PADDING.bottom}
                    stroke="#64748b"
                    strokeWidth="1"
                />
                {/* X-axis */}
                <line
                    x1={GRAPH_PADDING.left}
                    y1={GRAPH_HEIGHT - GRAPH_PADDING.bottom}
                    x2={graphWidth - GRAPH_PADDING.right}
                    y2={GRAPH_HEIGHT - GRAPH_PADDING.bottom}
                    stroke="#64748b"
                    strokeWidth="1"
                />

                {/* Y-axis ticks and labels */}
                {yTicks.map((value, i) => (
                    <g key={`y-${i}`}>
                        <line
                            x1={GRAPH_PADDING.left - 5}
                            y1={scaleY(value)}
                            x2={GRAPH_PADDING.left}
                            y2={scaleY(value)}
                            stroke="#64748b"
                        />
                        <text
                            x={GRAPH_PADDING.left - 8}
                            y={scaleY(value)}
                            textAnchor="end"
                            alignmentBaseline="middle"
                            fontSize="10"
                            fill="#94a3b8"
                        >
                            {Math.round(value)}
                        </text>
                        {/* Grid line */}
                        <line
                            x1={GRAPH_PADDING.left}
                            y1={scaleY(value)}
                            x2={graphWidth - GRAPH_PADDING.right}
                            y2={scaleY(value)}
                            stroke="#334155"
                            strokeWidth="0.5"
                            strokeDasharray="4,4"
                        />
                    </g>
                ))}

                {/* X-axis ticks and labels */}
                {xTicks.map((tick) => (
                    <g key={`x-${tick}`}>
                        <line
                            x1={scaleX(tick)}
                            y1={GRAPH_HEIGHT - GRAPH_PADDING.bottom}
                            x2={scaleX(tick)}
                            y2={GRAPH_HEIGHT - GRAPH_PADDING.bottom + 5}
                            stroke="#64748b"
                        />
                        <text
                            x={scaleX(tick)}
                            y={GRAPH_HEIGHT - GRAPH_PADDING.bottom + 16}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#94a3b8"
                        >
                            {tick}
                        </text>
                    </g>
                ))}

                {/* Data lines */}
                {selectedVitals.map((vital) => renderLine(vital))}

                {/* Data points */}
                {selectedVitals.map((vital) => renderDataPoints(vital))}
            </svg>

            {/* Tooltip */}
            {hoveredPoint && (
                <div className="vitals-tooltip">
                    <strong>Tick {hoveredPoint.tick}</strong>
                    {selectedVitals.map((vital) => {
                        const config = VITAL_CONFIG[vital];
                        const value = hoveredPoint[vital];
                        if (!config || typeof value !== "number") return null;
                        return (
                            <div key={vital} style={{ color: config.color }}>
                                {config.label}: {value.toFixed(1)} {config.unit}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default VitalsTrendGraph;
