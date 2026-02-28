import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/utils/supabase";

const formatDate = (date: Date) => {
	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	return formatter.format(date);
};

export const Route = createFileRoute("/retro/")({
	loader: async () => {
		const { data: retros } = await supabase.from("retros").select();
		return { retros };
	},
	component: Home,
});

function Home() {
	const { retros } = Route.useLoaderData();
	const navigate = useNavigate();
	const [isCreating, setIsCreating] = useState(false);

	const handleCreateRetro = async () => {
		setIsCreating(true);
		const { data: retro, error } = await supabase
			.from("retros")
			.insert({})
			.select()
			.single();
		setIsCreating(false);

		if (error || !retro) {
			return;
		}

		navigate({ to: "/retro/$retroId", params: { retroId: retro.id } });
	};

	return (
		<div className="container mx-auto max-w-5xl p-6 md:p-12 flex flex-col gap-8">
			<div className="flex justify-between items-center">
				<h1 className="text-4xl font-extrabold tracking-tight">
					Retrospectives
				</h1>
				<Button onClick={handleCreateRetro} disabled={isCreating}>
					<PlusIcon className="w-4 h-4 mr-2" />
					{isCreating ? "Creating..." : "Create new retro"}
				</Button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{retros?.map((retro) => (
					<Link
						key={retro.id}
						to="/retro/$retroId"
						params={{ retroId: retro.id }}
						className="block group h-full"
					>
						<Card className="h-full hover:border-primary/50 transition-colors">
							<CardHeader>
								<CardTitle className="text-xl flex items-center gap-2">
									<CalendarIcon className="w-5 h-5 text-muted-foreground" />
									{retro.created_at
										? formatDate(new Date(retro.created_at))
										: "Unknown Date"}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground break-all">
									ID: {retro.id.split("-")[0]}
								</p>
							</CardContent>
						</Card>
					</Link>
				))}

				{(!retros || retros.length === 0) && (
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
		</div>
	);
}
