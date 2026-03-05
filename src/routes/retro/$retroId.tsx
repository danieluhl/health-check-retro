import { createFileRoute } from "@tanstack/react-router";
import { ChevronsUpDownIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Discussion } from "@/components/retro/Discussion";
import { Survey } from "@/components/retro/Survey";
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
	const storageKey = useMemo(() => `retro:${retro.id}:sections`, [retro.id]);
	const [surveyOpen, setSurveyOpen] = useState(false);
	const [discussionOpen, setDiscussionOpen] = useState(false);

	const setLocalStorage = useCallback(
		({
			surveyOpen,
			discussionOpen,
		}: {
			surveyOpen: boolean;
			discussionOpen: boolean;
		}) => {
			localStorage.setItem(
				storageKey,
				JSON.stringify({ surveyOpen, discussionOpen }),
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
			if (typeof parsed?.surveyOpen === "boolean") {
				setSurveyOpen(parsed.surveyOpen);
				setLocalStorage({ surveyOpen: parsed.surveyOpen, discussionOpen });
			}
			if (typeof parsed?.discussionOpen === "boolean") {
				setDiscussionOpen(parsed.discussionOpen);
				setLocalStorage({ surveyOpen, discussionOpen: parsed.discussionOpen });
			}
		} catch {
			// ignore invalid storage
		}
	}, []);

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
					className="text-center w-full"
					open={surveyOpen}
					onOpenChange={(v) => {
						setLocalStorage({ surveyOpen: v, discussionOpen });
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
						setLocalStorage({ surveyOpen, discussionOpen: v });
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
