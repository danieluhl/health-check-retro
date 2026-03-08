import { ArrowBigRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/utils/supabase";

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

type SurveySectionProps = {
	surveyId: string;
	retroCreatedAt: string | null;
	teamId: string | null;
};

export function SurveySection({
	surveyId,
	retroCreatedAt,
	teamId,
}: SurveySectionProps) {
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
					.eq("survey_id", surveyId);

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

			if (teamId) {
				retrosQuery = retrosQuery.eq("team_id", teamId);
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
	}, [teamId, surveyId]);

	return (
		<div className="grid w-full grid-cols-1 gap-6">
			<Card>
				<CardHeader className="flex flex-row justify-between items-center">
					<CardTitle>This Retro</CardTitle>
					<Sheet>
						<SheetTrigger asChild>
							<Button size="icon" variant="outline">
								<ArrowBigRightIcon className="text-green-400" />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
							<SheetHeader>
								<SheetTitle>Vibe Check</SheetTitle>
								<SheetDescription>
									How are you feeling about the team?
								</SheetDescription>
							</SheetHeader>
							<Survey surveyId={surveyId} retroCreatedAt={retroCreatedAt} />
						</SheetContent>
					</Sheet>
				</CardHeader>
				<CardContent>
					{isLoadingCharts ? (
						<p className="text-sm text-muted-foreground">Loading chart...</p>
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
						<p className="text-sm text-muted-foreground">Loading chart...</p>
					) : pastRetrosQuestionData.length === 0 ? (
						<p className="text-sm text-muted-foreground">No retro data yet.</p>
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
	);
}
