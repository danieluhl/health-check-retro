import { createFileRoute } from "@tanstack/react-router";
import { CircleHelpIcon } from "lucide-react";
import { Discussion } from "@/components/retro/Discussion";
import { Experiments } from "@/components/retro/Experiments";
import { SurveySection } from "@/components/retro/SurveySection";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/dateUtils";
import { supabase } from "../../utils/supabase";

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

	const createdAt = retro?.created_at
		? formatDate(new Date(retro.created_at))
		: "Unknown";

	return (
		<div className="container py-6 mx-auto flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<h1>{createdAt}</h1>
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
			</div>
			<div className="flex w-full flex-col gap-8 items-center justify-between">
				<Tabs defaultValue="survey" className="w-full">
					<TabsList>
						<TabsTrigger value="survey">Vibe Check</TabsTrigger>
						<TabsTrigger value="discussion">Discussion</TabsTrigger>
					</TabsList>
					<TabsContent value="survey">
						<SurveySection
							surveyId={survey.id}
							retroCreatedAt={retro.created_at}
							teamId={retro.team_id}
						/>
					</TabsContent>
					<TabsContent value="discussion" className="space-y-4">
						<Discussion retroId={retro.id} />
						<Experiments retroId={retro.id} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
