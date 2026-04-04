import type { Props } from "remix/component"

import { cn } from "#app/utils/cn.ts"

export type LabelProps = Props<"label">

export function Label() {
	return ({ className, class: _class, ...props }: LabelProps) => {
		return (
			<label
				data-slot="label"
				className={cn(
					"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
					className,
					_class,
				)}
				{...props}
			/>
		)
	}
}
