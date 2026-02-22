import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "../../utils/supabase";

export const Route = createFileRoute("/retro/$retroId")({
	loader: async ({ params }) => {
		const { data: retro, error } = await supabase
			.from("retro")
			.select("id, created_at")
			.eq("id", params.retroId)
			.single();

		if (error) {
			throw error;
		}

		return { retro };
	},
	component: RetroRoute,
});

function RetroRoute() {
	const { retro } = Route.useLoaderData();
	const createdAt = retro?.created_at
		? new Date(retro.created_at).toLocaleString()
		: "Unknown";

	return <h1>Retro created {createdAt}</h1>;
}
