import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
	string,
	{
		label: string;
		color: string;
	}
>;

type ChartContainerProps = React.ComponentProps<"div"> & {
	config: ChartConfig;
	children: React.ComponentProps<typeof ResponsiveContainer>["children"];
};

export function ChartContainer({
	className,
	config,
	children,
	...props
}: ChartContainerProps) {
	const style = React.useMemo(() => {
		const vars: Record<string, string> = {};
		for (const [key, value] of Object.entries(config)) {
			vars[`--color-${key}`] = value.color;
		}
		return vars as React.CSSProperties;
	}, [config]);

	return (
		<div className={cn("h-[300px] w-full", className)} style={style} {...props}>
			<ResponsiveContainer>{children}</ResponsiveContainer>
		</div>
	);
}

export const ChartTooltip = Tooltip;

type ChartTooltipContentProps = {
	active?: boolean;
	payload?: Array<{
		dataKey?: string | number;
		name?: string | number;
		value?: string | number;
		color?: string;
	}>;
	label?: string | number;
	hideLabel?: boolean;
};

export function ChartTooltipContent({
	active,
	payload,
	label,
	hideLabel,
}: ChartTooltipContentProps) {
	if (!active || !payload?.length) {
		return null;
	}

	return (
		<div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
			{hideLabel ? null : <p className="mb-2 font-medium">{label}</p>}
			<div className="space-y-1">
				{payload.map((item) => (
					<div
						key={`${item.dataKey}`}
						className="flex items-center justify-between gap-3"
					>
						<div className="flex items-center gap-2">
							<div
								className="h-2.5 w-2.5 rounded-[2px]"
								style={{ backgroundColor: item.color }}
							/>
							<span>{item.name ?? item.dataKey}</span>
						</div>
						<span className="font-mono tabular-nums">{item.value ?? 0}</span>
					</div>
				))}
			</div>
		</div>
	);
}
