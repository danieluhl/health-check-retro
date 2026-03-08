import {
	CheckIcon,
	FlaskConicalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase";

type Experiment = {
	id: string;
	text: string;
	status: string;
};

type ExperimentStatus = "active" | "accepted" | "rejected";

const normalizeStatus = (status: string): ExperimentStatus => {
	if (status === "active" || status === "accepted" || status === "rejected") {
		return status;
	}
	return "active";
};

const statusConfig: Record<
	ExperimentStatus,
	{ label: string; className: string }
> = {
	active: {
		label: "Active",
		className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
	},
	accepted: {
		label: "Accepted",
		className: "bg-green-500/15 text-green-400 border-green-500/30",
	},
	rejected: {
		label: "Rejected",
		className: "bg-red-500/15 text-red-400 border-red-500/30",
	},
};

type ExperimentsProps = {
	retroId: string;
};

export function Experiments({ retroId }: ExperimentsProps) {
	const { session } = useAuth();
	const userId = session?.user?.id ?? null;
	const [experiments, setExperiments] = useState<Experiment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [draftText, setDraftText] = useState("");
	const [experimentToDelete, setExperimentToDelete] =
		useState<Experiment | null>(null);
	const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

	const ensureUserExists = useCallback(async () => {
		if (!userId) return;
		const email = session?.user?.email ?? null;
		await supabase.from("users").upsert(
			{
				id: userId,
				email,
			},
			{ onConflict: "id" },
		);
	}, [session?.user?.email, userId]);

	useEffect(() => {
		let isMounted = true;
		const loadExperiments = async () => {
			const { data, error } = await supabase
				.from("experiments")
				.select("id, text, status")
				.eq("retro_id", retroId)
				.order("created_at", { ascending: true });

			if (!isMounted) return;
			if (error) {
				setIsLoading(false);
				return;
			}

			setExperiments(data ?? []);
			setIsLoading(false);
		};

		void loadExperiments();
		return () => {
			isMounted = false;
		};
	}, [retroId]);

	const handleRealtimeChange = useCallback(
		(payload: {
			eventType: string;
			new: Record<string, unknown>;
			old: Record<string, unknown>;
		}) => {
			if (payload.eventType === "INSERT") {
				const row = payload.new as {
					id: string;
					text: string;
					status: string;
					retro_id: string;
				};
				if (row.retro_id !== retroId) return;
				setExperiments((prev) => {
					if (prev.some((e) => e.id === row.id)) return prev;
					return [...prev, { id: row.id, text: row.text, status: row.status }];
				});
			} else if (payload.eventType === "UPDATE") {
				const row = payload.new as {
					id: string;
					text: string;
					status: string;
					retro_id: string;
				};
				if (row.retro_id !== retroId) return;
				setExperiments((prev) =>
					prev.map((e) =>
						e.id === row.id ? { ...e, text: row.text, status: row.status } : e,
					),
				);
			} else if (payload.eventType === "DELETE") {
				const row = payload.old as { id: string; retro_id?: string };
				if (!row.id) return;
				if (row.retro_id && row.retro_id !== retroId) return;
				setExperiments((prev) => prev.filter((e) => e.id !== row.id));
				if (editingId === row.id) {
					setEditingId(null);
					setDraftText("");
				}
				setExperimentToDelete((prev) => (prev?.id === row.id ? null : prev));
			}
		},
		[editingId, retroId],
	);

	useRealtimeSubscription({
		channelName: `experiments:retro:${retroId}`,
		table: "experiments",
		event: "*",
		onPayload: handleRealtimeChange,
	});

	const handleAdd = useCallback(async () => {
		if (!userId || isCreating) return;
		setIsCreating(true);
		await ensureUserExists();
		const { data, error } = await supabase
			.from("experiments")
			.insert({
				retro_id: retroId,
				text: "New experiment",
				status: "active",
			})
			.select("id, text, status")
			.single();
		setIsCreating(false);

		if (error || !data) return;

		setExperiments((prev) => {
			if (prev.some((e) => e.id === data.id)) return prev;
			return [...prev, data];
		});

		setEditingId(data.id);
		setDraftText(data.text);
	}, [ensureUserExists, isCreating, retroId, userId]);

	const handleStartEdit = useCallback(
		(experiment: Experiment) => {
			if (!userId) return;
			setEditingId(experiment.id);
			setDraftText(experiment.text);
		},
		[userId],
	);

	const saveText = useCallback(
		async (experimentId: string, nextText: string) => {
			const current = experiments.find((e) => e.id === experimentId);
			const trimmed = nextText.trim();
			if (!current) {
				setEditingId(null);
				return;
			}
			if (!trimmed) {
				setEditingId(null);
				setDraftText("");
				return;
			}
			if (trimmed === current.text) {
				setEditingId(null);
				return;
			}

			setExperiments((prev) =>
				prev.map((e) => (e.id === experimentId ? { ...e, text: trimmed } : e)),
			);
			const { error } = await supabase
				.from("experiments")
				.update({ text: trimmed })
				.eq("id", experimentId);

			if (error) {
				setExperiments((prev) =>
					prev.map((e) =>
						e.id === experimentId ? { ...e, text: current.text } : e,
					),
				);
			}
			setEditingId(null);
			setDraftText("");
		},
		[experiments],
	);

	const handleUpdateStatus = useCallback(
		async (experimentId: string, nextStatus: ExperimentStatus) => {
			const current = experiments.find((e) => e.id === experimentId);
			if (!current) return;
			const currentStatus = normalizeStatus(current.status);
			// Toggle back to "active" if clicking the already-selected status
			const resolvedStatus =
				currentStatus === nextStatus ? "active" : nextStatus;
			if (currentStatus === resolvedStatus) return;

			setExperiments((prev) =>
				prev.map((e) =>
					e.id === experimentId ? { ...e, status: resolvedStatus } : e,
				),
			);

			const { error } = await supabase
				.from("experiments")
				.update({ status: resolvedStatus })
				.eq("id", experimentId);

			if (error) {
				setExperiments((prev) =>
					prev.map((e) =>
						e.id === experimentId ? { ...e, status: currentStatus } : e,
					),
				);
			}
		},
		[experiments],
	);

	const handleDelete = useCallback(async () => {
		if (!userId || !experimentToDelete || isDeletingId) return;

		setIsDeletingId(experimentToDelete.id);
		const { error } = await supabase
			.from("experiments")
			.delete()
			.eq("id", experimentToDelete.id);

		setIsDeletingId(null);
		if (error) return;

		setExperiments((prev) =>
			prev.filter((e) => e.id !== experimentToDelete.id),
		);
		if (editingId === experimentToDelete.id) {
			setEditingId(null);
			setDraftText("");
		}
		setExperimentToDelete(null);
	}, [editingId, isDeletingId, experimentToDelete, userId]);

	const handleEditButtonClick = useCallback(
		(experiment: Experiment) => {
			if (editingId === experiment.id) {
				void saveText(experiment.id, draftText);
				return;
			}
			handleStartEdit(experiment);
		},
		[draftText, editingId, handleStartEdit, saveText],
	);

	const renderExperimentCard = (experiment: Experiment) => {
		const status = normalizeStatus(experiment.status);
		const config = statusConfig[status];

		return (
			<Card key={experiment.id}>
				<CardHeader
					className={cn("gap-3 py-3", {
						"flex items-center justify-between": editingId !== experiment.id,
						"flex flex-col items-stretch": editingId === experiment.id,
					})}
				>
					<div
						className={cn({
							"flex-1": editingId !== experiment.id,
							"w-full": editingId === experiment.id,
						})}
					>
						{editingId === experiment.id ? (
							<textarea
								value={draftText}
								onChange={(event) => setDraftText(event.target.value)}
								onBlur={() => {
									void saveText(experiment.id, draftText);
								}}
								onKeyDown={(event) => {
									if (event.key === "Escape") {
										event.preventDefault();
										void saveText(experiment.id, draftText);
									}
									if (
										event.key === "Enter" &&
										(event.metaKey || event.ctrlKey)
									) {
										event.preventDefault();
										void saveText(experiment.id, draftText);
									}
								}}
								className="min-h-20 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						) : (
							<CardTitle className="text-base font-semibold">
								{experiment.text}
							</CardTitle>
						)}
					</div>
					<span
						className={cn(
							"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0",
							config.className,
						)}
					>
						{config.label}
					</span>
				</CardHeader>
				<CardFooter className="gap-2 justify-between">
					<div className="flex items-center gap-2">
						<Button
							size="icon"
							variant="outline"
							onClick={() => handleEditButtonClick(experiment)}
							disabled={!userId || isDeletingId !== null}
						>
							<PencilIcon />
							<span className="sr-only">Edit</span>
						</Button>
						<Button
							size="icon"
							variant="outline"
							onClick={() => setExperimentToDelete(experiment)}
							disabled={!userId || isDeletingId !== null}
							className="text-zinc-600 hover:text-destructive-foreground hover:bg-destructive"
						>
							<Trash2Icon />
							<span className="sr-only">Delete</span>
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<Button
							size="icon"
							variant="outline"
							onClick={() => handleUpdateStatus(experiment.id, "accepted")}
							disabled={!userId}
							className={cn({
								"bg-green-500/15 border-green-500/30 text-green-400":
									status === "accepted",
							})}
						>
							<CheckIcon />
							<span className="sr-only">Accept</span>
						</Button>
						<Button
							size="icon"
							variant="outline"
							onClick={() => handleUpdateStatus(experiment.id, "rejected")}
							disabled={!userId}
							className={cn({
								"bg-red-500/15 border-red-500/30 text-red-400":
									status === "rejected",
							})}
						>
							<XIcon />
							<span className="sr-only">Reject</span>
						</Button>
					</div>
				</CardFooter>
			</Card>
		);
	};

	return (
		<>
			<Card className="w-full">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<FlaskConicalIcon className="size-5" />
						Experiments
					</CardTitle>
					<Button
						size="icon"
						variant="outline"
						onClick={handleAdd}
						disabled={!userId || isCreating}
					>
						<PlusIcon />
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<p className="text-sm text-muted-foreground">
							Loading experiments...
						</p>
					) : experiments.length === 0 ? (
						<p className="text-sm text-muted-foreground">No experiments yet.</p>
					) : (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
							{experiments.map(renderExperimentCard)}
						</div>
					)}
				</CardContent>
			</Card>
			<Dialog
				open={experimentToDelete !== null}
				onOpenChange={(isOpen) => {
					if (isOpen || isDeletingId) return;
					setExperimentToDelete(null);
				}}
			>
				<DialogContent showCloseButton={!isDeletingId}>
					<DialogHeader>
						<DialogTitle>Delete experiment?</DialogTitle>
						<DialogDescription>
							This will permanently delete
							{experimentToDelete
								? ` "${experimentToDelete.text}".`
								: " this experiment."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setExperimentToDelete(null)}
							disabled={Boolean(isDeletingId)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								void handleDelete();
							}}
							disabled={!experimentToDelete || Boolean(isDeletingId)}
						>
							{isDeletingId ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
