"use client";

import { useMemo, useState } from "react";

type EdgeInput = { source: string; target: string; weight?: number };

type ApiResponse =
	| { route: { nodes: string[]; cost: number } | null }
	| { routes: { nodes: string[]; cost: number }[] };

export default function Home() {
	const [edgesText, setEdgesText] = useState("A,B,1\nB,C,1\nC,D,1\nA,D,5");
	const [start, setStart] = useState("A");
	const [goal, setGoal] = useState("D");
	const [k, setK] = useState(1);
	const [algorithm, setAlgorithm] = useState("dijkstra");
	const [result, setResult] = useState<ApiResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const edges: EdgeInput[] = useMemo(() => {
		return edgesText
			.split(/\n|;/)
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => {
				const [source, target, weight] = line.split(/[ ,\t]+/);
				return { source, target, weight: weight ? Number(weight) : undefined } as EdgeInput;
			});
	}, [edgesText]);

	async function submit() {
		setError(null);
		setLoading(true);
		try {
			const res = await fetch("/api/routes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ edges, start, goal, k, algorithm }),
			});
			const data = (await res.json()) as ApiResponse & { error?: string };
			if (!res.ok) throw new Error(data.error || "Request failed");
			setResult(data);
		} catch (e) {
			const message = e instanceof Error ? e.message : "Unknown error";
			setError(message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-3xl mx-auto p-6 space-y-4">
			<h1 className="text-2xl font-semibold">Route Planner MVP</h1>
			<div className="grid gap-4 md:grid-cols-2">
				<label className="block">
					<span className="text-sm">Edges CSV (source,target,weight)</span>
					<textarea
						className="mt-1 w-full h-40 p-2 border rounded"
						value={edgesText}
						onChange={(e) => setEdgesText(e.target.value)}
					/>
				</label>
				<div className="grid gap-2">
					<label className="block">
						<span className="text-sm">Start</span>
						<input className="mt-1 w-full p-2 border rounded" value={start} onChange={(e) => setStart(e.target.value)} />
					</label>
					<label className="block">
						<span className="text-sm">Goal</span>
						<input className="mt-1 w-full p-2 border rounded" value={goal} onChange={(e) => setGoal(e.target.value)} />
					</label>
					<label className="block">
						<span className="text-sm">K (number of routes)</span>
						<input type="number" min={1} className="mt-1 w-full p-2 border rounded" value={k} onChange={(e) => setK(Number(e.target.value))} />
					</label>
					<label className="block">
						<span className="text-sm">Algorithm</span>
						<select className="mt-1 w-full p-2 border rounded" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
							<option value="dijkstra">Dijkstra</option>
							<option value="yens">Yen (K shortest)</option>
						</select>
					</label>
					<button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded" onClick={submit} disabled={loading}>
						{loading ? "Calculating..." : "Calculate"}
					</button>
				</div>
			</div>

			{error && <div className="text-red-600">{error}</div>}
			<div className="space-y-2">
				{result && "route" in result && result.route && (
					<div className="p-3 border rounded">
						<div className="font-medium">Shortest Route</div>
						<div>Path: {result.route.nodes.join(" → ")}</div>
						<div>Cost: {result.route.cost}</div>
					</div>
				)}
				{result && "routes" in result && (
					<div className="space-y-2">
						<div className="font-medium">K Shortest Routes</div>
						{result.routes.map((r, idx) => (
							<div key={idx} className="p-3 border rounded">
								<div>#{idx + 1}: {r.nodes.join(" → ")}</div>
								<div>Cost: {r.cost}</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
