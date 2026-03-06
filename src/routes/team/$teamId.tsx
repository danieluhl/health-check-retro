import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	CalendarIcon,
	PlusIcon,
	SquareArrowRightIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
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
import { formatDate } from "@/lib/dateUtils";
import { supabase } from "@/utils/supabase";

export const Route = createFileRoute("/team/$teamId")({
	loader: async ({ params }) => {
		const { data: team, error } = await supabase
			.from("teams")
			.select("id, name")
			.eq("id", params.teamId)
			.single();
		const { data: retros } = await supabase
			.from("retros")
			.select()
			.eq("team_id", params.teamId);

		if (error) {
			throw error;
		}

		return { team, retros };
	},
	component: Home,
});

function Home() {
	const { team, retros } = Route.useLoaderData();
	const navigate = useNavigate();
	const [isCreating, setIsCreating] = useState(false);
	const [retroList, setRetroList] = useState(retros ?? []);
	const [retroToDelete, setRetroToDelete] = useState<
		(typeof retroList)[number] | null
	>(null);
	const [isDeletingRetroId, setIsDeletingRetroId] = useState<string | null>(
		null,
	);

	const handleCreateRetro = async () => {
		setIsCreating(true);
		const { data: retro, error } = await supabase
			.from("retros")
			.insert({ team_id: team.id })
			.select()
			.single();
		setIsCreating(false);

		if (error || !retro) {
			return;
		}

		navigate({ to: "/retro/$retroId", params: { retroId: retro.id } });
	};

	const handleDeleteRetro = async () => {
		if (!retroToDelete) {
			return;
		}

		setIsDeletingRetroId(retroToDelete.id);
		const { error } = await supabase
			.from("retros")
			.delete()
			.eq("id", retroToDelete.id)
			.eq("team_id", team.id);
		setIsDeletingRetroId(null);

		if (error) {
			return;
		}

		setRetroList((prev) =>
			prev.filter((retro) => retro.id !== retroToDelete.id),
		);
		setRetroToDelete(null);
	};

	return (
		<div className="container mx-auto max-w-5xl p-6 md:p-12 flex flex-col gap-8">
			<div className="flex justify-between items-center">
				<h1 className="text-4xl font-extrabold tracking-tight">
					{team.name} Retrospectives
				</h1>
				<Button onClick={handleCreateRetro} disabled={isCreating}>
					<PlusIcon className="w-4 h-4 mr-2" />
					{isCreating ? "Creating..." : "Create new retro"}
				</Button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{retroList.map((retro) => (
					<Card
						key={retro.id}
						className="h-full hover:border-primary/50 transition-colors"
					>
						<CardHeader
							className="cursor-pointer"
							onClick={() => {
								navigate({
									to: "/retro/$retroId",
									params: { retroId: retro.id },
								});
							}}
						>
							<div className="flex items-start justify-between gap-2">
								<CardTitle className="text-xl flex items-center gap-2">
									<CalendarIcon className="w-5 h-5 text-muted-foreground" />
									{retro.created_at
										? formatDate(new Date(retro.created_at))
										: "Unknown Date"}
								</CardTitle>
								<Button
									onClick={() => {
										navigate({
											to: "/retro/$retroId",
											params: { retroId: retro.id },
										});
									}}
									className=""
									variant="ghost"
									size="icon"
								>
									<SquareArrowRightIcon />
								</Button>
							</div>
						</CardHeader>
						<CardContent className="flex justify-between items-center">
							<p className="text-sm text-muted-foreground break-all">
								Id: {retro.id.split("-")[0]}
							</p>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-destructive"
								onClick={() => setRetroToDelete(retro)}
							>
								<Trash2Icon className="w-4 h-4" />
								<span className="sr-only">Delete retro</span>
							</Button>
						</CardContent>
					</Card>
				))}

				{retroList.length === 0 && (
					<div className="col-span-full py-24 text-center text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-xl">
						<p className="text-lg">No retrospectives found.</p>
						<Button
							variant="outline"
							onClick={handleCreateRetro}
							disabled={isCreating}
						>
							<PlusIcon className="w-4 h-4 mr-2" />
							Create your first retro
						</Button>
					</div>
				)}
			</div>
			<Dialog
				open={retroToDelete !== null}
				onOpenChange={(isOpen) => {
					if (isOpen || Boolean(isDeletingRetroId)) {
						return;
					}
					setRetroToDelete(null);
				}}
			>
				<DialogContent showCloseButton={!isDeletingRetroId}>
					<DialogHeader>
						<DialogTitle>Delete retro?</DialogTitle>
						<DialogDescription>
							This will permanently delete
							{retroToDelete?.created_at
								? ` the retro from ${formatDate(new Date(retroToDelete.created_at))}.`
								: " this retro."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRetroToDelete(null)}
							disabled={Boolean(isDeletingRetroId)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								void handleDeleteRetro();
							}}
							disabled={!retroToDelete || Boolean(isDeletingRetroId)}
						>
							{isDeletingRetroId ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
