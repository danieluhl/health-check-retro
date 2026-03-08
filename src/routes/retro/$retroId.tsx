import { createFileRoute } from "@tanstack/react-router";
import { ArrowBigRightIcon, CircleHelpIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { Discussion } from "@/components/retro/Discussion";
import { Experiments } from "@/components/retro/Experiments";
import { Survey } from "@/components/retro/Survey";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
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

type Sentiment = (typeof sentiments)[number];

type QuestionChartDatum = {
	question: string;
	happy: number;
	medium: number;
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
	const [isLoadingCharts, setIsLoadingCharts] = useState(true);
	const [questionStatsData, setQuestionStatsData] = useState<
		QuestionChartDatum[]
	>([]);
	const [pastRetrosQuestionData, setPastRetrosQuestionData] = useState<
		QuestionChartDatum[]
	>([]);

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
				setPastRetrosQuestionData([]);
				setIsLoadingCharts(false);
				return;
			}

			const retroIds = (lastRetros ?? []).map((item) => item.id);
			if (retroIds.length === 0) {
				setQuestionStatsData(initialQuestionStats);
				setPastRetrosQuestionData([]);
				setIsLoadingCharts(false);
				return;
			}

			const { data: surveysForRetros, error: surveysError } = await supabase
				.from("surveys")
				.select("id, retro_id")
				.in("retro_id", retroIds);

			if (!isMounted || surveysError) {
				setQuestionStatsData(initialQuestionStats);
				setPastRetrosQuestionData([]);
				setIsLoadingCharts(false);
				return;
			}

			const surveyIds = (surveysForRetros ?? []).map((item) => item.id);
			if (surveyIds.length === 0) {
				setQuestionStatsData(initialQuestionStats);
				setPastRetrosQuestionData([]);
				setIsLoadingCharts(false);
				return;
			}

			const { data: entriesForLastFive, error: entriesError } = await supabase
				.from("entries")
				.select("survey_id, answers")
				.in("survey_id", surveyIds);

			// Aggregate past 5 retros by question (same layout as "This Retro")
			const pastQuestionStats = surveyQuestions.map((question) => ({
				question: question.label,
				happy: 0,
				medium: 0,
				sad: 0,
			}));

			if (!entriesError) {
				for (const entry of entriesForLastFive ?? []) {
					const answers = parseAnswers(entry.answers);
					for (const [questionId, rawSentiment] of Object.entries(answers)) {
						const idx = questionIndexById[questionId];
						const sentiment = normalizeSentiment(rawSentiment);
						if (idx === undefined || !sentiment) {
							continue;
						}
						pastQuestionStats[idx][sentiment] += 1;
					}
				}
			}

			if (!isMounted) {
				return;
			}

			setQuestionStatsData(initialQuestionStats);
			setPastRetrosQuestionData(pastQuestionStats);
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
		<div className="container py-6 mx-auto flex flex-col">
			<div className="flex items-center justify-between">
				<Dialog>
					<DialogTrigger asChild>
						<Button size="icon" variant="ghost">
							<CircleHelpIcon className="h-5 w-5" />
							<span className="sr-only">How to Retro</span>
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>How to Retro</DialogTitle>
							<DialogDescription>
								A quick guide to running your retrospective.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 text-sm">
							<section>
								<h3 className="font-semibold mb-1">1. Vibe Check</h3>
								<p className="text-muted-foreground">
									Start by having each team member fill out the survey. Rate how
									you feel about Teamwork, Mission, Process, Producing,
									Learning, and Fun.
								</p>
							</section>
							<section>
								<h3 className="font-semibold mb-1">2. Discussion</h3>
								<p className="text-muted-foreground">
									Add topics the team wants to talk about. Vote on what matters
									most, then discuss the top items one at a time. Use the timer
									to ensure as many topics can be discussed.
								</p>
							</section>
							<section>
								<h3 className="font-semibold mb-1">3. Experiments</h3>
								<p className="text-muted-foreground">
									Propose small, actionable experiments to try before the next
									retro. Active experiments from the previous retro carry over
									automatically so you can accept or reject them.
								</p>
							</section>
						</div>
					</DialogContent>
				</Dialog>
				<h1>{createdAt}</h1>
			</div>
			<div className="flex w-full flex-col gap-8 items-center justify-between">
				<Discussion retroId={retro.id} />
				<Experiments retroId={retro.id} />
				<div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader className="flex flex-row justify-between items-center">
							<CardTitle>This Retro</CardTitle>
							<Sheet>
								<SheetTrigger asChild>
									<Button size="icon" variant="outline">
										<ArrowBigRightIcon />
									</Button>
								</SheetTrigger>
								<SheetContent
									side="right"
									className="overflow-y-auto sm:max-w-lg"
								>
									<SheetHeader>
										<SheetTitle>Vibe Check</SheetTitle>
										<SheetDescription>
											How are you feeling about the team?
										</SheetDescription>
									</SheetHeader>
									<Survey
										surveyId={survey.id}
										retroCreatedAt={retro?.created_at}
									/>
								</SheetContent>
							</Sheet>
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
							<CardTitle>Trends</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoadingCharts ? (
								<p className="text-sm text-muted-foreground">
									Loading chart...
								</p>
							) : pastRetrosQuestionData.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No retro data yet.
								</p>
							) : (
								<ChartContainer config={questionStatsChartConfig}>
									<BarChart data={pastRetrosQuestionData}>
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
				</div>
			</div>
		</div>
	);
}
