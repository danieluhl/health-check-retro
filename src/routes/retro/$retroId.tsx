import { createFileRoute } from "@tanstack/react-router";
import { ChevronsUpDownIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { Discussion } from "@/components/retro/Discussion";
import { Survey } from "@/components/retro/Survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatDate } from "@/lib/dateUtils";
import { supabase } from "../../utils/supabase";

const surveyQuestions = [
	{ id: "teamwork", label: "Teamwork" },
	{ id: "mission", label: "Mission" },
	{ id: "process", label: "Process" },
	{ id: "producing", label: "Producing" },
	{ id: "learning", label: "Learning" },
	{ id: "fun", label: "Fun" },
] as const;

const sentiments = ["happy", "medium", "sad"] as const;

const questionStatsChartConfig: ChartConfig = {
	happy: { label: "🙂", color: "oklch(0.7 0.17 145)" },
	medium: { label: "😐", color: "oklch(0.74 0.15 90)" },
	sad: { label: "🙁", color: "oklch(0.62 0.2 28)" },
};

const lastFiveTotalsChartConfig: ChartConfig = {
	happy: { label: "🙂", color: "oklch(0.7 0.17 145)" },
	meh: { label: "😐", color: "oklch(0.74 0.15 90)" },
	sad: { label: "🙁", color: "oklch(0.62 0.2 28)" },
};

type Sentiment = (typeof sentiments)[number];

type QuestionChartDatum = {
	question: string;
	happy: number;
	medium: number;
	sad: number;
};

type LastFiveDatum = {
	retroDate: string;
	happy: number;
	meh: number;
	sad: number;
};

const parseAnswers = (value: unknown): Record<string, string> => {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	const result: Record<string, string> = {};
	for (const [key, entryValue] of Object.entries(value)) {
		if (typeof entryValue === "string") {
			result[key] = entryValue;
		}
	}

	return result;
};

const normalizeSentiment = (value: string): Sentiment | null => {
	if (value === "happy") return "happy";
	if (value === "sad") return "sad";
	if (value === "neutral") return "medium";
	if (value === "medium") return "medium";
	return null;
};

const formatRetroAxisDate = (dateString: string) =>
	new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
	}).format(new Date(dateString));

export const Route = createFileRoute("/retro/$retroId")({
	loader: async ({ params }) => {
		const { data: retro, error } = await supabase
			.from("retros")
			.select("id, created_at, team_id")
			.eq("id", params.retroId)
			.single();

		const { data: survey, error: surveyError } = await supabase
			.from("surveys")
			.select("id")
			.eq("retro_id", params.retroId)
			.single();

		if (error) {
			throw error;
		}
		if (surveyError) {
			throw surveyError;
		}

		return { retro, survey };
	},
	component: RetroRoute,
});

function RetroRoute() {
	const { retro, survey } = Route.useLoaderData();
	const storageKey = useMemo(() => `retro:${retro.id}:sections`, [retro.id]);
	const [crunchOpen, setCrunchOpen] = useState(true);
	const [surveyOpen, setSurveyOpen] = useState(false);
	const [discussionOpen, setDiscussionOpen] = useState(false);
	const [isLoadingCharts, setIsLoadingCharts] = useState(true);
	const [questionStatsData, setQuestionStatsData] = useState<
		QuestionChartDatum[]
	>([]);
	const [lastFiveTotalsData, setLastFiveTotalsData] = useState<LastFiveDatum[]>(
		[],
	);

	const setLocalStorage = useCallback(
		({
			crunchOpen,
			surveyOpen,
			discussionOpen,
		}: {
			crunchOpen: boolean;
			surveyOpen: boolean;
			discussionOpen: boolean;
		}) => {
			localStorage.setItem(
				storageKey,
				JSON.stringify({ crunchOpen, surveyOpen, discussionOpen }),
			);
		},
		[storageKey],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only run on load
	useEffect(() => {
		const raw = localStorage.getItem(storageKey);
		if (!raw) {
			return;
		}
		try {
			const parsed = JSON.parse(raw);
			if (typeof parsed?.crunchOpen === "boolean") {
				setCrunchOpen(parsed.crunchOpen);
				setLocalStorage({
					crunchOpen: parsed.crunchOpen,
					surveyOpen,
					discussionOpen,
				});
			}
			if (typeof parsed?.surveyOpen === "boolean") {
				setSurveyOpen(parsed.surveyOpen);
				setLocalStorage({
					crunchOpen,
					surveyOpen: parsed.surveyOpen,
					discussionOpen,
				});
			}
			if (typeof parsed?.discussionOpen === "boolean") {
				setDiscussionOpen(parsed.discussionOpen);
				setLocalStorage({
					crunchOpen,
					surveyOpen,
					discussionOpen: parsed.discussionOpen,
				});
			}
		} catch {
			// ignore invalid storage
		}
	}, []);

	useEffect(() => {
		let isMounted = true;

		const loadCharts = async () => {
			setIsLoadingCharts(true);

			const { data: currentEntries, error: currentEntriesError } =
				await supabase
					.from("entries")
					.select("answers")
					.eq("survey_id", survey.id);

			if (!isMounted || currentEntriesError) {
				setIsLoadingCharts(false);
				return;
			}

			const initialQuestionStats = surveyQuestions.map((question) => ({
				question: question.label,
				happy: 0,
				medium: 0,
				sad: 0,
			}));

			const questionIndexById = surveyQuestions.reduce<Record<string, number>>(
				(acc, question, index) => {
					acc[question.id] = index;
					return acc;
				},
				{},
			);

			for (const entry of currentEntries ?? []) {
				const answers = parseAnswers(entry.answers);
				for (const [questionId, rawSentiment] of Object.entries(answers)) {
					const idx = questionIndexById[questionId];
					const sentiment = normalizeSentiment(rawSentiment);
					if (idx === undefined || !sentiment) {
						continue;
					}
					initialQuestionStats[idx][sentiment] += 1;
				}
			}

			let retrosQuery = supabase
				.from("retros")
				.select("id, created_at")
				.order("created_at", { ascending: false })
				.limit(5);

			if (retro.team_id) {
				retrosQuery = retrosQuery.eq("team_id", retro.team_id);
			} else {
				retrosQuery = retrosQuery.is("team_id", null);
			}

			const { data: lastRetros, error: retrosError } = await retrosQuery;
			if (!isMounted || retrosError) {
				setQuestionStatsData(initialQuestionStats);
				setLastFiveTotalsData([]);
				setIsLoadingCharts(false);
				return;
			}

			const retroIds = (lastRetros ?? []).map((item) => item.id);
			if (retroIds.length === 0) {
				setQuestionStatsData(initialQuestionStats);
				setLastFiveTotalsData([]);
				setIsLoadingCharts(false);
				return;
			}

			const { data: surveysForRetros, error: surveysError } = await supabase
				.from("surveys")
				.select("id, retro_id")
				.in("retro_id", retroIds);

			if (!isMounted || surveysError) {
				setQuestionStatsData(initialQuestionStats);
				setLastFiveTotalsData(
					(lastRetros ?? [])
						.slice()
						.reverse()
						.map((item) => ({
							retroDate: formatRetroAxisDate(item.created_at),
							happy: 0,
							meh: 0,
							sad: 0,
						})),
				);
				setIsLoadingCharts(false);
				return;
			}

			const surveyIds = (surveysForRetros ?? []).map((item) => item.id);
			if (surveyIds.length === 0) {
				setQuestionStatsData(initialQuestionStats);
				setLastFiveTotalsData(
					(lastRetros ?? [])
						.slice()
						.reverse()
						.map((item) => ({
							retroDate: formatRetroAxisDate(item.created_at),
							happy: 0,
							meh: 0,
							sad: 0,
						})),
				);
				setIsLoadingCharts(false);
				return;
			}

			const { data: entriesForLastFive, error: entriesError } = await supabase
				.from("entries")
				.select("survey_id, answers")
				.in("survey_id", surveyIds);

			const surveyIdToRetroId: Record<string, string> = {};
			for (const surveyRow of surveysForRetros ?? []) {
				surveyIdToRetroId[surveyRow.id] = surveyRow.retro_id;
			}

			const totalsByRetro: Record<
				string,
				{ happy: number; meh: number; sad: number }
			> = {};
			for (const retroRow of lastRetros ?? []) {
				totalsByRetro[retroRow.id] = { happy: 0, meh: 0, sad: 0 };
			}

			if (!entriesError) {
				for (const entry of entriesForLastFive ?? []) {
					const retroIdForEntry = surveyIdToRetroId[entry.survey_id];
					if (!retroIdForEntry || !totalsByRetro[retroIdForEntry]) {
						continue;
					}

					const answers = parseAnswers(entry.answers);
					for (const rawSentiment of Object.values(answers)) {
						const sentiment = normalizeSentiment(rawSentiment);
						if (!sentiment) {
							continue;
						}

						if (sentiment === "medium") {
							totalsByRetro[retroIdForEntry].meh += 1;
							continue;
						}

						totalsByRetro[retroIdForEntry][sentiment] += 1;
					}
				}
			}

			if (!isMounted) {
				return;
			}

			setQuestionStatsData(initialQuestionStats);
			setLastFiveTotalsData(
				(lastRetros ?? [])
					.slice()
					.reverse()
					.map((retroRow) => ({
						retroDate: formatRetroAxisDate(retroRow.created_at),
						happy: totalsByRetro[retroRow.id]?.happy ?? 0,
						meh: totalsByRetro[retroRow.id]?.meh ?? 0,
						sad: totalsByRetro[retroRow.id]?.sad ?? 0,
					})),
			);
			setIsLoadingCharts(false);
		};

		void loadCharts();

		return () => {
			isMounted = false;
		};
	}, [retro.team_id, survey.id]);

	const createdAt = retro?.created_at
		? formatDate(new Date(retro.created_at))
		: "Unknown";

	return (
		<div className="container mx-auto py-8 flex flex-col gap-8">
			<div className="text-center">
				<h1 className="text-3xl font-bold mb-2">{createdAt}</h1>
			</div>
			<div className="flex w-full flex-col gap-8 items-center justify-between">
				<Collapsible
					className="text-center w-full flex flex-col gap-8"
					open={crunchOpen}
					onOpenChange={(v) => {
						setLocalStorage({ crunchOpen: v, surveyOpen, discussionOpen });
						setCrunchOpen(v);
					}}
				>
					<CollapsibleTrigger className="rounded justify-center w-full flex bg-secondary gap-4 py-2">
						<ChevronsUpDownIcon />
						Crunch
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
							<Card>
								<CardHeader>
									<CardTitle>This Retro</CardTitle>
								</CardHeader>
								<CardContent>
									{isLoadingCharts ? (
										<p className="text-sm text-muted-foreground">
											Loading chart...
										</p>
									) : (
										<ChartContainer config={questionStatsChartConfig}>
											<BarChart data={questionStatsData}>
												<CartesianGrid vertical={false} strokeDasharray="3 3" />
												<XAxis
													dataKey="question"
													tickLine={false}
													axisLine={false}
													tickMargin={8}
												/>
												<YAxis allowDecimals={false} />
												<ChartTooltip
													cursor={{
														fill: "var(--color-muted)",
														fillOpacity: 0.35,
													}}
													content={<ChartTooltipContent />}
												/>
												<Legend />
												<Bar
													dataKey="happy"
													name="🙂"
													fill="var(--color-happy)"
													stackId="mood"
													radius={[4, 4, 0, 0]}
												/>
												<Bar
													dataKey="medium"
													name="😐"
													fill="var(--color-medium)"
													stackId="mood"
												/>
												<Bar
													dataKey="sad"
													name="🙁"
													fill="var(--color-sad)"
													stackId="mood"
												/>
											</BarChart>
										</ChartContainer>
									)}
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<CardTitle>Old Retros</CardTitle>
								</CardHeader>
								<CardContent>
									{isLoadingCharts ? (
										<p className="text-sm text-muted-foreground">
											Loading chart...
										</p>
									) : lastFiveTotalsData.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No retro data yet.
										</p>
									) : (
										<ChartContainer config={lastFiveTotalsChartConfig}>
											<BarChart data={lastFiveTotalsData}>
												<CartesianGrid vertical={false} strokeDasharray="3 3" />
												<XAxis
													dataKey="retroDate"
													tickLine={false}
													axisLine={false}
													tickMargin={8}
												/>
												<YAxis allowDecimals={false} />
												<ChartTooltip
													cursor={{
														fill: "var(--color-muted)",
														fillOpacity: 0.35,
													}}
													content={<ChartTooltipContent />}
												/>
												<Legend />
												<Bar
													dataKey="happy"
													name="🙂"
													fill="var(--color-happy)"
													stackId="retro-mood"
													radius={[4, 4, 0, 0]}
												/>
												<Bar
													dataKey="meh"
													name="😐"
													fill="var(--color-meh)"
													stackId="retro-mood"
												/>
												<Bar
													dataKey="sad"
													name="🙁"
													fill="var(--color-sad)"
													stackId="retro-mood"
												/>
											</BarChart>
										</ChartContainer>
									)}
								</CardContent>
							</Card>
						</div>
					</CollapsibleContent>
				</Collapsible>
				<Collapsible
					className="text-center w-full"
					open={surveyOpen}
					onOpenChange={(v) => {
						setLocalStorage({ crunchOpen, surveyOpen: v, discussionOpen });
						setSurveyOpen(v);
					}}
				>
					<CollapsibleTrigger className="rounded justify-center w-full flex bg-secondary gap-4 py-2">
						<ChevronsUpDownIcon />
						Vibe Check
					</CollapsibleTrigger>
					<CollapsibleContent>
						<Survey surveyId={survey.id} retroCreatedAt={retro?.created_at} />
					</CollapsibleContent>
				</Collapsible>
				<Collapsible
					className="text-center w-full"
					open={discussionOpen}
					onOpenChange={(v) => {
						setLocalStorage({ crunchOpen, surveyOpen, discussionOpen: v });
						setDiscussionOpen(v);
					}}
				>
					<CollapsibleTrigger className="rounded justify-center w-full flex bg-secondary gap-4 py-2">
						<ChevronsUpDownIcon />
						Discussion
					</CollapsibleTrigger>
					<CollapsibleContent className="w-full">
						<Discussion retroId={retro.id} />
					</CollapsibleContent>
				</Collapsible>
			</div>
		</div>
	);
}
