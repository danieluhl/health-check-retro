import { createFileRoute } from "@tanstack/react-router";
import { ChevronsUpDownIcon } from "lucide-react";
import { Survey } from "@/components/retro/Survey";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatDate } from "@/lib/dateUtils";
import { supabase } from "../../utils/supabase";

export const Route = createFileRoute("/retro/$retroId")({
	loader: async ({ params }) => {
		const { data: retro, error } = await supabase
			.from("retros")
			.select("id, created_at")
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
		<div className="container mx-auto py-8 flex flex-col gap-8">
			<div className="text-center">
				<h1 className="text-3xl font-bold mb-2">Let the Jam Begin</h1>
				<p className="text-muted-foreground">{createdAt}</p>
			</div>
			<div className="flex w-full flex-col gap-8 items-center justify-between">
				<Collapsible className="text-center">
					<CollapsibleTrigger>
						<Button size="lg">
							<ChevronsUpDownIcon />
							Vibe Check
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<Survey surveyId={survey.id} retroCreatedAt={retro?.created_at} />
					</CollapsibleContent>
				</Collapsible>
				<Collapsible className="text-center">
					<CollapsibleTrigger>
						<Button size="lg">
							<ChevronsUpDownIcon />
							Discussion
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent>todo</CollapsibleContent>
				</Collapsible>
			</div>
		</div>
	);
}
