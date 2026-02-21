import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "../utils/supabase";

export const Route = createFileRoute("/")({
	loader: async () => {
		const { data: retro } = await supabase.from("retro").select();
		return { retros: retro };
	},
	component: Home,
});

function Home() {
	const { retros } = Route.useLoaderData();

	return (
		<ul>
			{retros?.map((retros) => (
				<li key={retros.id}>{retros.id}</li>
			))}
		</ul>
	);
}
