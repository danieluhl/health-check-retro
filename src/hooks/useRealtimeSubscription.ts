import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect } from "react";
import { supabase } from "@/utils/supabase";

type TableName = "surveys" | "topics" | "votes" | "entries" | "retros" | "experiments";
type Event = "INSERT" | "UPDATE" | "DELETE" | "*";

type SubscriptionConfig = {
	/** Unique channel name for this subscription */
	channelName: string;
	/** Table to listen to */
	table: TableName;
	/** Event type(s) to listen for */
	event: Event;
	/** Optional Postgres filter, e.g. "retro_id=eq.abc123" */
	filter?: string;
	/** Callback invoked with every matching change */
	onPayload: (
		payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
	) => void;
};

/**
 * Subscribe to Supabase Realtime Postgres Changes for a single table.
 * Automatically subscribes on mount and unsubscribes on unmount.
 */
export function useRealtimeSubscription({
	channelName,
	table,
	event,
	filter,
	onPayload,
}: SubscriptionConfig) {
	useEffect(() => {
		const channelConfig: {
			event: Event;
			schema: string;
			table: TableName;
			filter?: string;
		} = {
			event,
			schema: "public",
			table,
		};
		if (filter) {
			channelConfig.filter = filter;
		}

		const channel = supabase
			.channel(channelName)
			// .channel(channelName, { config: { private: true } })
			.on("postgres_changes", channelConfig, onPayload)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [channelName, table, event, filter, onPayload]);
}
