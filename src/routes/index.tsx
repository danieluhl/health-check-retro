import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Database } from "../types/supabase.gen";
import { supabase } from "../utils/supabase";

const DEFAULT_TEAM_NAME = "my new team";
type Team = Database["public"]["Tables"]["teams"]["Row"];

export const Route = createFileRoute("/")({
	loader: async () => {
		const { data: teams } = await supabase
			.from("teams")
			.select()
			.order("created_at", { ascending: false });
		return { teams: teams ?? [] };
	},
	component: TeamsPage,
});

function TeamsPage() {
	const { teams: initialTeams } = Route.useLoaderData();
	const [teams, setTeams] = useState<Team[]>(() => initialTeams ?? []);
	const [isCreating, setIsCreating] = useState(false);
	const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
	const [draftName, setDraftName] = useState("");

	const navigate = useNavigate();

	const handleAddTeam = async () => {
		setIsCreating(true);
		const { data: team, error } = await supabase
			.from("teams")
			.insert({ name: DEFAULT_TEAM_NAME })
			.select()
			.single();
		setIsCreating(false);

		if (error || !team) {
			return;
		}

		setTeams((current: Team[]) => [team, ...current]);
	};

	const handleStartEdit = (teamId: string, currentName: string) => {
		setEditingTeamId(teamId);
		setDraftName(currentName);
	};

	const handleCancelEdit = () => {
		setEditingTeamId(null);
		setDraftName("");
	};

	const handleSaveEdit = async () => {
		if (!editingTeamId) {
			return;
		}

		const trimmedName = draftName.trim();
		if (!trimmedName) {
			handleCancelEdit();
			return;
		}

		const { data: updatedTeam, error } = await supabase
			.from("teams")
			.update({ name: trimmedName })
			.eq("id", editingTeamId)
			.select()
			.single();

		if (error || !updatedTeam) {
			return;
		}

		setTeams((current: Team[]) =>
			current.map((team: Team) =>
				team.id === updatedTeam.id ? updatedTeam : team,
			),
		);
		setEditingTeamId(null);
		setDraftName("");
	};

	return (
		<div className="container mx-auto max-w-5xl p-6 md:p-12 flex flex-col gap-8">
			<div className="flex justify-between items-center">
				<h1 className="text-4xl font-extrabold tracking-tight">Teams</h1>
				<Button
					onClick={handleAddTeam}
					disabled={isCreating}
					size="icon"
					aria-label="Add new team"
				>
					<PlusIcon className="w-4 h-4" />
				</Button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{teams.map((team: Team) => {
					const isEditing = editingTeamId === team.id;
					return (
						<Card
							key={team.id}
							className="h-full cursor-pointer"
							onClick={() => {
								navigate({
									to: "/team/$teamId",
									params: { teamId: team.id },
								});
							}}
						>
							<CardHeader>
								{isEditing ? (
									<Input
										value={draftName}
										onChange={(event) => setDraftName(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												event.preventDefault();
												void handleSaveEdit();
											}
											if (event.key === "Escape") {
												event.preventDefault();
												handleCancelEdit();
											}
										}}
										onFocus={(event) => event.currentTarget.select()}
										autoFocus
										className="text-lg font-semibold"
									/>
								) : (
									<CardTitle>
										<button
											type="button"
											className="text-left w-full hover:text-primary transition-colors"
											onClick={() => handleStartEdit(team.id, team.name)}
										>
											{team.name}
										</button>
									</CardTitle>
								)}
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground break-all">
									ID: {team.id.split("-")[0]}
								</p>
							</CardContent>
						</Card>
					);
				})}

				{teams.length === 0 && (
					<div className="col-span-full py-24 text-center text-muted-foreground flex flex-col items-center gap-4 border-2 border-dashed rounded-xl">
						<p className="text-lg">No teams found.</p>
						<Button
							variant="outline"
							onClick={handleAddTeam}
							disabled={isCreating}
						>
							<PlusIcon className="w-4 h-4 mr-2" />
							Create your first team
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
