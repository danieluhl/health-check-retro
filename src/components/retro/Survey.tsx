import { Frown, Meh, Smile } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase";

const questions = [
	{
		id: "teamwork",
		label: "Teamwork",
		description: "We are jelled and have awesome collaboration",
	},
	{
		id: "mission",
		label: "Mission",
		description: "We know why we’re here and we’re excited about it",
	},
	{
		id: "process",
		label: "Process",
		description: "Our way of working suits us perfectly",
	},
	{
		id: "producing",
		label: "Producing",
		description: "We deliver great stuff quickly",
	},
	{
		id: "learning",
		label: "Learning",
		description: "We’re learning lots of interesting stuff",
	},
	{
		id: "fun",
		label: "Fun",
		description: "We have a great time together",
	},
];

const ratings = [
	{
		value: "sad",
		icon: Frown,
		color: "bg-red-900",
		hoverColor: "hover:bg-red-900",
	},
	{
		value: "neutral",
		icon: Meh,
		color: "bg-yellow-700",
		hoverColor: "hover:bg-yellow-700",
	},
	{
		value: "happy",
		icon: Smile,
		color: "bg-green-700",
		hoverColor: "hover:bg-green-700",
	},
];

type SurveyProps = {
	surveyId: string;
	retroCreatedAt?: string | null;
};

const isSameDay = (left: Date, right: Date) =>
	left.getFullYear() === right.getFullYear() &&
	left.getMonth() === right.getMonth() &&
	left.getDate() === right.getDate();

export function Survey({ surveyId, retroCreatedAt }: SurveyProps) {
	const { session } = useAuth();
	const userId = session?.user?.id ?? null;
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(true);
	const isEditable = retroCreatedAt
		? isSameDay(new Date(retroCreatedAt), new Date())
		: false;

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

	const loadExistingEntry = useCallback(async () => {
		if (!userId) return;
		const { data, error } = await supabase
			.from("entries")
			.select("answers")
			.eq("survey_id", surveyId)
			.eq("user_id", userId)
			.maybeSingle();

		if (error) {
			setIsLoading(false);
			return;
		}

		if (
			data?.answers &&
			typeof data.answers === "object" &&
			!Array.isArray(data.answers)
		) {
			setAnswers(data.answers as Record<string, string>);
		}
		setIsLoading(false);
	}, [surveyId, userId]);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			if (!userId) {
				setIsLoading(false);
				return;
			}
			await ensureUserExists();
			if (!isMounted) return;
			await loadExistingEntry();
		};
		void load();
		return () => {
			isMounted = false;
		};
	}, [ensureUserExists, loadExistingEntry, userId]);

	// --- Realtime: live response count + cross-tab sync ---

	const [responseCount, setResponseCount] = useState(0);

	useEffect(() => {
		let isMounted = true;
		const loadResponseCount = async () => {
			const { count, error } = await supabase
				.from("entries")
				.select("id", { count: "exact", head: true })
				.eq("survey_id", surveyId);
			if (!isMounted || error) return;
			setResponseCount(count ?? 0);
		};
		void loadResponseCount();
		return () => {
			isMounted = false;
		};
	}, [surveyId]);

	const handleEntryChange = useCallback(
		(payload: { eventType: string; new: Record<string, unknown> }) => {
			if (payload.eventType === "INSERT") {
				setResponseCount((prev) => prev + 1);
			}

			// Cross-tab sync: update own answers when changed in another tab
			const row = payload.new as {
				survey_id: string;
				user_id: string;
				answers: Record<string, string> | null;
			};
			if (
				row.user_id === userId &&
				row.survey_id === surveyId &&
				row.answers &&
				typeof row.answers === "object" &&
				!Array.isArray(row.answers)
			) {
				setAnswers(row.answers);
			}
		},
		[userId, surveyId],
	);

	useRealtimeSubscription({
		channelName: `entries:survey:${surveyId}`,
		table: "entries",
		event: "*",
		filter: `survey_id=eq.${surveyId}`,
		onPayload: handleEntryChange,
	});

	const persistAnswers = useCallback(
		async (nextAnswers: Record<string, string>) => {
			if (!userId) return;
			await ensureUserExists();
			await supabase.from("entries").upsert(
				{
					survey_id: surveyId,
					user_id: userId,
					answers: nextAnswers,
				},
				{ onConflict: "survey_id,user_id" },
			);
		},
		[ensureUserExists, surveyId, userId],
	);

	const handleRatingChange = (questionId: string, value: string) => {
		setAnswers((prev) => {
			const nextAnswers = { ...prev, [questionId]: value };
			void persistAnswers(nextAnswers);
			return nextAnswers;
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-6 max-w-2xl mx-auto p-4 text-sm text-muted-foreground">
				Loading survey...
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-2xl mx-auto p-4">
			<p className="text-sm text-muted-foreground text-center">
				{responseCount} {responseCount === 1 ? "person has" : "people have"}{" "}
				responded
			</p>
			{questions.map((q) => (
				<Card key={q.id}>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg font-bold">{q.label}</CardTitle>
						<p className="text-sm text-muted-foreground">{q.description}</p>
					</CardHeader>
					<CardContent>
						<div className="flex justify-around items-center pt-2">
							{ratings.map((r) => {
								const Icon = r.icon;
								const isSelected = answers[q.id] === r.value;
								const optionId = `${q.id}-${r.value}`;
								return (
									<Label
										key={r.value}
										htmlFor={optionId}
										className={cn(
											"flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
											"duration-200 text-muted-foreground hover:text-primary-foreground",
											{
												"cursor-pointer": isEditable,
												"cursor-not-allowed opacity-50": !isEditable,
												[r.hoverColor]: isEditable || isSelected,
												[`text-primary-foreground ${r.color}`]: isSelected,
												"scale-110": isSelected && isEditable,
												grayscale: !isSelected,
												"opacity-60 hover:grayscale-0 hover:opacity-100":
													!isSelected && isEditable,
												"opacity-50": !isSelected && !isEditable,
											},
										)}
									>
										<input
											type="radio"
											id={optionId}
											name={q.id}
											value={r.value}
											checked={isSelected}
											onChange={() => handleRatingChange(q.id, r.value)}
											disabled={!isEditable}
											className="sr-only"
										/>
										<Icon className={cn("w-10 h-10")} />
									</Label>
								);
							})}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
