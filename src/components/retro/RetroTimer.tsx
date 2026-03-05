import { PauseIcon, PlayIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { supabase } from "@/utils/supabase";
import { Button } from "../ui/button";

type RetroTimerProps = {
	retroId: string;
};

const FIVE_MINUTES_MS = 3 * 60 * 1000;
const TWO_MINUTES_MS = 2 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

type RetroTimerRow = {
	id: string;
	timer: string;
};

const formatRemainingTime = (remainingMs: number) => {
	const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
	const minutes = Math.floor(remainingSeconds / 60);
	const seconds = remainingSeconds % 60;
	return `${String(minutes)}:${String(seconds).padStart(2, "0")}`;
};

export function RetroTimer({ retroId }: RetroTimerProps) {
	const [timerEnd, setTimerEnd] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [nowMs, setNowMs] = useState(() => Date.now());
	const [isPaused, setIsPaused] = useState(false);
	const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(
		null,
	);

	const loadTimer = useCallback(async () => {
		const { data, error } = await supabase
			.from("retros")
			.select("timer")
			.eq("id", retroId)
			.single();

		if (error || !data?.timer) {
			setTimerEnd(null);
			return;
		}

		setTimerEnd(data.timer);
	}, [retroId]);

	useEffect(() => {
		void loadTimer();
	}, [loadTimer]);

	useEffect(() => {
		const interval = setInterval(() => {
			setNowMs(Date.now());
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	const handleRetroUpdate = useCallback(
		(payload: { eventType: string; new: Record<string, unknown> }) => {
			if (payload.eventType !== "UPDATE") {
				return;
			}

			const row = payload.new as RetroTimerRow;

			if (row.id !== retroId) {
				return;
			}

			setTimerEnd(row.timer);
			setIsPaused(false);
			setPausedRemainingMs(null);
		},
		[retroId],
	);

	useRealtimeSubscription({
		channelName: `retros:timer:${retroId}`,
		table: "retros",
		event: "*",
		onPayload: handleRetroUpdate,
	});

	const updateTimer = useCallback(
		async (nextTimer: string) => {
			setIsSaving(true);
			const { data, error } = await supabase
				.from("retros")
				.update({ timer: nextTimer })
				.eq("id", retroId)
				.select("timer")
				.single();
			setIsSaving(false);

			if (error) {
				return;
			}

			if (data?.timer) {
				setTimerEnd(data.timer);
				setIsPaused(false);
				setPausedRemainingMs(null);
			}
		},
		[retroId],
	);

	const computeRemainingMs = useCallback(
		(endAt: string | null, currentMs: number) => {
			if (!endAt) {
				return 0;
			}

			const endMs = new Date(endAt).getTime();
			if (!Number.isFinite(endMs)) {
				return 0;
			}

			return Math.max(0, endMs - currentMs);
		},
		[],
	);

	const handleRefreshTimer = useCallback(async () => {
		const nextTimer = new Date(Date.now() + FIVE_MINUTES_MS).toISOString();
		await updateTimer(nextTimer);
	}, [updateTimer]);

	const handleAddTwoMinutes = useCallback(async () => {
		const currentEndMs = timerEnd ? new Date(timerEnd).getTime() : Date.now();
		const baseMs = Number.isFinite(currentEndMs) ? currentEndMs : Date.now();
		const nextTimer = new Date(baseMs + TWO_MINUTES_MS).toISOString();
		await updateTimer(nextTimer);
	}, [timerEnd, updateTimer]);

	const remainingMs = useMemo(() => {
		if (isPaused) {
			return Math.max(0, pausedRemainingMs ?? 0);
		}

		return computeRemainingMs(timerEnd, nowMs);
	}, [computeRemainingMs, isPaused, nowMs, pausedRemainingMs, timerEnd]);

	const remainingLabel = useMemo(
		() => formatRemainingTime(remainingMs),
		[remainingMs],
	);

	const handleTogglePause = useCallback(async () => {
		if (isPaused) {
			const nextRemaining = Math.max(0, pausedRemainingMs ?? 0);
			const nextTimer = new Date(Date.now() + nextRemaining).toISOString();
			await updateTimer(nextTimer);
			return;
		}

		const nextRemaining = computeRemainingMs(timerEnd, Date.now());
		setPausedRemainingMs(nextRemaining);
		setIsPaused(true);
	}, [computeRemainingMs, isPaused, pausedRemainingMs, timerEnd, updateTimer]);

	useEffect(() => {
		document.body.classList.remove("timer-warning-yellow", "timer-warning-red");
		let activeClass: "timer-warning-yellow" | "timer-warning-red" | null = null;

		if (remainingMs > ONE_MINUTE_MS && remainingMs <= TWO_MINUTES_MS) {
			activeClass = "timer-warning-yellow";
		}

		if (remainingMs > 0 && remainingMs <= ONE_MINUTE_MS) {
			activeClass = "timer-warning-red";
		}

		if (activeClass) {
			document.body.classList.add(activeClass);
		}

		return () => {
			document.body.classList.remove(
				"timer-warning-yellow",
				"timer-warning-red",
			);
		};
	}, [remainingMs]);

	return (
		<div className="flex items-center gap-2">
			<div className="font-mono tabular-nums min-w-14 text-right text-4xl">
				{remainingLabel}
			</div>
			<Button
				type="button"
				variant="secondary"
				size="sm"
				onClick={() => {
					void handleTogglePause();
				}}
				disabled={isSaving || remainingMs <= 0}
			>
				{isPaused ? (
					<PlayIcon className="size-4" />
				) : (
					<PauseIcon className="size-4" />
				)}
			</Button>
			<Button
				type="button"
				variant="secondary"
				size="sm"
				onClick={() => {
					void handleRefreshTimer();
				}}
				disabled={isSaving}
			>
				<RefreshCwIcon className="size-4" />
			</Button>
			<Button
				type="button"
				variant="secondary"
				size="sm"
				onClick={() => {
					void handleAddTwoMinutes();
				}}
				disabled={isSaving}
			>
				<PlusIcon />
			</Button>
		</div>
	);
}
