import {
	ArrowBigUpIcon,
	ArrowDown10Icon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type Topic = {
	id: string;
	text: string;
	status: string | null;
};

type TopicStatus = "open" | "active" | "closed";

const normalizeTopicStatus = (status: string | null): TopicStatus => {
	if (status === "open" || status === "active" || status === "closed") {
		return status;
	}

	return "open";
};

type DiscussionProps = {
	retroId: string;
};

export function Discussion({ retroId }: DiscussionProps) {
	const { session } = useAuth();
	const userId = session?.user?.id ?? null;
	const [topics, setTopics] = useState<Topic[]>([]);
	const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
	const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingVotes, setIsLoadingVotes] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
	const [draftText, setDraftText] = useState("");
	const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
	const [isDeletingTopicId, setIsDeletingTopicId] = useState<string | null>(
		null,
	);
	const [draggingTopicId, setDraggingTopicId] = useState<string | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [dropTargetStatus, setDropTargetStatus] = useState<TopicStatus | null>(
		null,
	);

	useEffect(() => {
		if (editingTopicId && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [editingTopicId]);

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
		const loadTopics = async () => {
			const { data, error } = await supabase
				.from("topics")
				.select("id, text, status")
				.eq("retro_id", retroId)
				.order("created_at", { ascending: true });

			if (!isMounted) return;
			if (error) {
				setIsLoading(false);
				return;
			}

			setTopics(data ?? []);
			setIsLoading(false);
		};

		void loadTopics();
		return () => {
			isMounted = false;
		};
	}, [retroId]);

	useEffect(() => {
		let isMounted = true;
		const loadVotes = async () => {
			if (topics.length === 0) {
				setVoteCounts({});
				setUserVotes({});
				return;
			}
			setIsLoadingVotes(true);
			const topicIds = topics.map((topic) => topic.id);
			const { data, error } = await supabase
				.from("votes")
				.select("topic_id, user_id")
				.in("topic_id", topicIds);

			if (!isMounted) return;
			setIsLoadingVotes(false);
			if (error) {
				return;
			}

			const nextCounts: Record<string, number> = {};
			const nextUserVotes: Record<string, boolean> = {};
			data?.forEach((vote) => {
				nextCounts[vote.topic_id] = (nextCounts[vote.topic_id] ?? 0) + 1;
				if (userId && vote.user_id === userId) {
					nextUserVotes[vote.topic_id] = true;
				}
			});
			topicIds.forEach((topicId) => {
				if (nextCounts[topicId] === undefined) {
					nextCounts[topicId] = 0;
				}
				if (nextUserVotes[topicId] === undefined) {
					nextUserVotes[topicId] = false;
				}
			});

			setVoteCounts(nextCounts);
			setUserVotes(nextUserVotes);
		};

		void loadVotes();
		return () => {
			isMounted = false;
		};
	}, [topics, userId]);

	// --- Realtime subscriptions ---

	const handleTopicChange = useCallback(
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
				setTopics((prev) => {
					if (prev.some((t) => t.id === row.id)) return prev;
					return [...prev, { id: row.id, text: row.text, status: row.status }];
				});
				setVoteCounts((prev) =>
					prev[row.id] !== undefined ? prev : { ...prev, [row.id]: 0 },
				);
				setUserVotes((prev) =>
					prev[row.id] !== undefined ? prev : { ...prev, [row.id]: false },
				);
			} else if (payload.eventType === "UPDATE") {
				const row = payload.new as {
					id: string;
					text: string;
					status: string;
					retro_id: string;
				};
				if (row.retro_id !== retroId) return;
				setTopics((prev) =>
					prev.map((t) =>
						t.id === row.id ? { ...t, text: row.text, status: row.status } : t,
					),
				);
			} else if (payload.eventType === "DELETE") {
				const row = payload.old as { id: string; retro_id?: string };
				if (!row.id) return;
				if (row.retro_id && row.retro_id !== retroId) return;
				setTopics((prev) => prev.filter((topic) => topic.id !== row.id));
				setVoteCounts((prev) => {
					if (prev[row.id] === undefined) return prev;
					const { [row.id]: _removed, ...remaining } = prev;
					return remaining;
				});
				setUserVotes((prev) => {
					if (prev[row.id] === undefined) return prev;
					const { [row.id]: _removed, ...remaining } = prev;
					return remaining;
				});
				if (editingTopicId === row.id) {
					setEditingTopicId(null);
					setDraftText("");
				}
				setTopicToDelete((prev) => (prev?.id === row.id ? null : prev));
			}
		},
		[editingTopicId, retroId],
	);

	useRealtimeSubscription({
		channelName: `topics:retro:${retroId}`,
		table: "topics",
		event: "*",
		onPayload: handleTopicChange,
	});

	const handleVoteChange = useCallback(
		(payload: {
			eventType: string;
			new: Record<string, unknown>;
			old: Record<string, unknown>;
		}) => {
			if (payload.eventType === "INSERT") {
				const row = payload.new as { topic_id: string; user_id: string };
				// Skip own events -- already handled optimistically
				if (userId && row.user_id === userId) return;
				setVoteCounts((prev) => ({
					...prev,
					[row.topic_id]: (prev[row.topic_id] ?? 0) + 1,
				}));
			} else if (payload.eventType === "DELETE") {
				const row = payload.old as { topic_id: string; user_id: string };
				if (!row.topic_id) return;
				// Skip own events -- already handled optimistically
				if (userId && row.user_id === userId) return;
				setVoteCounts((prev) => ({
					...prev,
					[row.topic_id]: Math.max(0, (prev[row.topic_id] ?? 1) - 1),
				}));
			}
		},
		[userId],
	);

	useRealtimeSubscription({
		channelName: `votes:retro:${retroId}`,
		table: "votes",
		event: "*",
		onPayload: handleVoteChange,
	});

	const handleAddTopic = useCallback(async () => {
		if (!userId || isCreating) return;
		setIsCreating(true);
		await ensureUserExists();
		const { data, error } = await supabase
			.from("topics")
			.insert({
				retro_id: retroId,
				user_id: userId,
				status: "open",
				text: "new",
			})
			.select("id, text, status")
			.single();
		setIsCreating(false);

		if (error || !data) {
			return;
		}

		setTopics((prev) => {
			if (prev.some((t) => t.id === data.id)) return prev;
			return [...prev, data];
		});
		setVoteCounts((prev) =>
			prev[data.id] !== undefined ? prev : { ...prev, [data.id]: 0 },
		);
		setUserVotes((prev) =>
			prev[data.id] !== undefined ? prev : { ...prev, [data.id]: false },
		);
	}, [ensureUserExists, isCreating, retroId, userId]);

	const handleSortTopicsByVotes = useCallback(() => {
		setTopics((prev) =>
			[...prev].sort((first, second) => {
				const firstVotes = voteCounts[first.id] ?? 0;
				const secondVotes = voteCounts[second.id] ?? 0;
				if (secondVotes !== firstVotes) {
					return secondVotes - firstVotes;
				}
				return first.text.localeCompare(second.text);
			}),
		);
	}, [voteCounts]);

	const handleUpdateTopicStatus = useCallback(
		async (topicId: string, nextStatus: TopicStatus) => {
			const currentTopic = topics.find((topic) => topic.id === topicId);
			if (!currentTopic) return;

			const currentStatus = normalizeTopicStatus(currentTopic.status);
			if (currentStatus === nextStatus) return;

			if (
				nextStatus === "active" &&
				topics.some(
					(topic) =>
						topic.id !== topicId &&
						normalizeTopicStatus(topic.status) === "active",
				)
			) {
				return;
			}

			setTopics((prev) =>
				prev.map((topic) =>
					topic.id === topicId ? { ...topic, status: nextStatus } : topic,
				),
			);

			const { error } = await supabase
				.from("topics")
				.update({ status: nextStatus })
				.eq("id", topicId)
				.eq("retro_id", retroId);

			if (error) {
				setTopics((prev) =>
					prev.map((topic) =>
						topic.id === topicId ? { ...topic, status: currentStatus } : topic,
					),
				);
			}
		},
		[retroId, topics],
	);

	const isDropAllowed = useCallback(
		(targetStatus: TopicStatus, topicId: string) => {
			if (targetStatus !== "active") {
				return true;
			}

			return !topics.some(
				(topic) =>
					topic.id !== topicId &&
					normalizeTopicStatus(topic.status) === "active",
			);
		},
		[topics],
	);

	const openTopics = topics.filter(
		(topic) => normalizeTopicStatus(topic.status) === "open",
	);
	const activeTopics = topics.filter(
		(topic) => normalizeTopicStatus(topic.status) === "active",
	);
	const closedTopics = topics.filter(
		(topic) => normalizeTopicStatus(topic.status) === "closed",
	);

	const handleVote = useCallback(
		async (topicId: string) => {
			if (!userId) return;
			const hasVoted = userVotes[topicId];
			setUserVotes((prev) => ({ ...prev, [topicId]: !hasVoted }));
			setVoteCounts((prev) => ({
				...prev,
				[topicId]: Math.max(0, (prev[topicId] ?? 0) + (hasVoted ? -1 : 1)),
			}));

			if (!hasVoted) {
				await ensureUserExists();
				const { error } = await supabase
					.from("votes")
					.insert({ topic_id: topicId, user_id: userId });

				if (error) {
					setUserVotes((prev) => ({ ...prev, [topicId]: false }));
					setVoteCounts((prev) => ({
						...prev,
						[topicId]: Math.max(0, (prev[topicId] ?? 1) - 1),
					}));
				}
				return;
			}

			const { error } = await supabase
				.from("votes")
				.delete()
				.eq("topic_id", topicId)
				.eq("user_id", userId);

			if (error) {
				setUserVotes((prev) => ({ ...prev, [topicId]: true }));
				setVoteCounts((prev) => ({
					...prev,
					[topicId]: (prev[topicId] ?? 0) + 1,
				}));
			}
		},
		[ensureUserExists, userId, userVotes],
	);

	const handleStartEdit = useCallback(
		(topic: Topic) => {
			if (!userId) return;
			setEditingTopicId(topic.id);
			setDraftText(topic.text);
		},
		[userId],
	);

	const saveTopicTitle = useCallback(
		async (topicId: string, nextText: string) => {
			const current = topics.find((topic) => topic.id === topicId);
			const trimmed = nextText.trim();
			if (!current) {
				setEditingTopicId(null);
				return;
			}
			if (!trimmed) {
				setEditingTopicId(null);
				setDraftText("");
				return;
			}
			if (trimmed === current.text) {
				setEditingTopicId(null);
				return;
			}

			setTopics((prev) =>
				prev.map((topic) =>
					topic.id === topicId ? { ...topic, text: trimmed } : topic,
				),
			);
			const { error } = await supabase
				.from("topics")
				.update({ text: trimmed })
				.eq("id", topicId);

			if (error) {
				setTopics((prev) =>
					prev.map((topic) =>
						topic.id === topicId ? { ...topic, text: current.text } : topic,
					),
				);
			}
			setEditingTopicId(null);
			setDraftText("");
		},
		[topics],
	);

	const handleDeleteTopic = useCallback(async () => {
		if (!userId || !topicToDelete || isDeletingTopicId) return;

		setIsDeletingTopicId(topicToDelete.id);
		const { error } = await supabase
			.from("topics")
			.delete()
			.eq("id", topicToDelete.id)
			.eq("retro_id", retroId);

		setIsDeletingTopicId(null);
		if (error) return;

		setTopics((prev) => prev.filter((topic) => topic.id !== topicToDelete.id));
		setVoteCounts((prev) => {
			if (prev[topicToDelete.id] === undefined) return prev;
			const { [topicToDelete.id]: _removed, ...remaining } = prev;
			return remaining;
		});
		setUserVotes((prev) => {
			if (prev[topicToDelete.id] === undefined) return prev;
			const { [topicToDelete.id]: _removed, ...remaining } = prev;
			return remaining;
		});
		if (editingTopicId === topicToDelete.id) {
			setEditingTopicId(null);
			setDraftText("");
		}
		setTopicToDelete(null);
	}, [editingTopicId, isDeletingTopicId, retroId, topicToDelete, userId]);

	const handleEditButtonClick = useCallback(
		(topic: Topic) => {
			if (editingTopicId === topic.id) {
				void saveTopicTitle(topic.id, draftText);
				return;
			}

			handleStartEdit(topic);
		},
		[draftText, editingTopicId, handleStartEdit, saveTopicTitle],
	);

	const renderTopicCard = (topic: Topic) => (
		<Card
			key={topic.id}
			draggable={editingTopicId !== topic.id}
			onDragStart={(event) => {
				event.dataTransfer.setData("text/topic-id", topic.id);
				event.dataTransfer.effectAllowed = "move";
				setDraggingTopicId(topic.id);
			}}
			onDragEnd={() => {
				setDraggingTopicId(null);
				setDropTargetStatus(null);
			}}
			className={cn("text-left", {
				"opacity-70": draggingTopicId === topic.id,
			})}
		>
			<CardHeader
				className={cn("gap-3 py-3", {
					"flex items-center justify-between": editingTopicId !== topic.id,
					"flex flex-col items-stretch": editingTopicId === topic.id,
				})}
			>
				<div
					className={cn({
						"flex-1": editingTopicId !== topic.id,
						"w-full": editingTopicId === topic.id,
					})}
				>
					{editingTopicId === topic.id ? (
						<textarea
							ref={textareaRef}
							value={draftText}
							onChange={(event) => setDraftText(event.target.value)}
							onBlur={() => {
								void saveTopicTitle(topic.id, draftText);
							}}
							onKeyDown={(event) => {
								if (event.key === "Escape") {
									event.preventDefault();
									void saveTopicTitle(topic.id, draftText);
								}
								if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
									event.preventDefault();
									void saveTopicTitle(topic.id, draftText);
								}
							}}
							className="min-h-32 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					) : (
						<CardTitle className="text-base font-semibold">
							{topic.text}
						</CardTitle>
					)}
				</div>
				<div className="w-full flex items-center gap-2 justify-between">
					<div className="flex items-center gap-2">
						<Button
							size="icon"
							variant="outline"
							onClick={() => handleEditButtonClick(topic)}
							disabled={!userId || isDeletingTopicId !== null}
						>
							<PencilIcon />
							<span className="sr-only">Edit topic</span>
						</Button>
						<Button
							size="icon"
							variant="outline"
							onClick={() => setTopicToDelete(topic)}
							disabled={!userId || isDeletingTopicId !== null}
							className="text-zinc-600 hover:text-destructive-foreground hover:bg-destructive"
						>
							<Trash2Icon />
							<span className="sr-only">Delete topic</span>
						</Button>
					</div>
					<Button
						variant="outline"
						onClick={() => handleVote(topic.id)}
						disabled={!userId || isLoadingVotes}
						className={cn({
							"bg-accent": !!userVotes[topic.id],
						})}
					>
						<ArrowBigUpIcon />
						{voteCounts[topic.id] ?? 0}
					</Button>
				</div>
			</CardHeader>
		</Card>
	);

	return (
		<div className="w-full flex flex-col gap-6 p-6">
			<Card
				className={cn("w-full", {
					"ring-2 ring-primary/40": dropTargetStatus === "active",
				})}
				onDragOver={(event) => {
					const topicId = draggingTopicId;
					if (!topicId || !isDropAllowed("active", topicId)) return;
					event.preventDefault();
					setDropTargetStatus("active");
				}}
				onDragLeave={() => {
					if (dropTargetStatus === "active") {
						setDropTargetStatus(null);
					}
				}}
				onDrop={(event) => {
					event.preventDefault();
					const topicId = event.dataTransfer.getData("text/topic-id");
					setDropTargetStatus(null);
					setDraggingTopicId(null);
					if (!topicId || !isDropAllowed("active", topicId)) return;
					void handleUpdateTopicStatus(topicId, "active");
				}}
			>
				<CardHeader>
					<CardTitle>Active Topic</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-3">
						{activeTopics.map(renderTopicCard)}
					</div>
				</CardContent>
			</Card>
			<div className="flex h-full gap-6">
				<Card
					className={cn("flex-1", {
						"ring-2 ring-primary/40": dropTargetStatus === "open",
					})}
					onDragOver={(event) => {
						if (!draggingTopicId) return;
						event.preventDefault();
						setDropTargetStatus("open");
					}}
					onDragLeave={() => {
						if (dropTargetStatus === "open") {
							setDropTargetStatus(null);
						}
					}}
					onDrop={(event) => {
						event.preventDefault();
						const topicId = event.dataTransfer.getData("text/topic-id");
						setDropTargetStatus(null);
						setDraggingTopicId(null);
						if (!topicId) return;
						void handleUpdateTopicStatus(topicId, "open");
					}}
				>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Topics</CardTitle>
						<div className="flex items-center gap-2">
							<Button
								size="icon"
								variant="outline"
								onClick={handleSortTopicsByVotes}
								disabled={topics.length === 0 || isLoadingVotes}
							>
								<ArrowDown10Icon />
							</Button>
							<Button
								size="icon"
								variant="outline"
								onClick={handleAddTopic}
								disabled={!userId || isCreating}
							>
								<PlusIcon />
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<p className="text-sm text-muted-foreground">Loading topic...</p>
						) : openTopics.length === 0 ? (
							<p className="text-sm text-muted-foreground">No topics yet.</p>
						) : (
							<div className="flex flex-col gap-3">
								{openTopics.map(renderTopicCard)}
							</div>
						)}
					</CardContent>
				</Card>
				<Card
					className={cn("flex-1", {
						"ring-2 ring-primary/40": dropTargetStatus === "closed",
					})}
					onDragOver={(event) => {
						if (!draggingTopicId) return;
						event.preventDefault();
						setDropTargetStatus("closed");
					}}
					onDragLeave={() => {
						if (dropTargetStatus === "closed") {
							setDropTargetStatus(null);
						}
					}}
					onDrop={(event) => {
						event.preventDefault();
						const topicId = event.dataTransfer.getData("text/topic-id");
						setDropTargetStatus(null);
						setDraggingTopicId(null);
						if (!topicId) return;
						void handleUpdateTopicStatus(topicId, "closed");
					}}
				>
					<CardHeader>
						<CardTitle>Sauce</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<p className="text-sm text-muted-foreground">Loading sauce...</p>
						) : closedTopics.length === 0 ? (
							<p className="text-sm text-muted-foreground">No sauce yet.</p>
						) : (
							<div className="flex flex-col gap-3">
								{closedTopics.map(renderTopicCard)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
			<Dialog
				open={topicToDelete !== null}
				onOpenChange={(isOpen) => {
					if (isOpen || isDeletingTopicId) return;
					setTopicToDelete(null);
				}}
			>
				<DialogContent showCloseButton={!isDeletingTopicId}>
					<DialogHeader>
						<DialogTitle>Delete topic?</DialogTitle>
						<DialogDescription>
							This will permanently delete
							{topicToDelete ? `"${topicToDelete.text}".` : "this topic."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setTopicToDelete(null)}
							disabled={Boolean(isDeletingTopicId)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								void handleDeleteTopic();
							}}
							disabled={!topicToDelete || Boolean(isDeletingTopicId)}
						>
							{isDeletingTopicId ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
