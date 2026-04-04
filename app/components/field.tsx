import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import type { Props } from "remix/component"

import { cn } from "#app/utils/cn.ts"

import { Label, type LabelProps } from "./label"

export function FieldSet() {
	return ({ className, class: _class, ...props }: Props<"fieldset">) => {
		return (
			<fieldset
				data-slot="field-set"
				className={cn(
					"flex flex-col gap-6 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
					className,
					_class,
				)}
				{...props}
			/>
		)
	}
}

export function FieldLegend() {
	return ({
		className,
		variant = "legend",
		...props
	}: Props<"legend"> & { variant?: "legend" | "label" }) => {
		return (
			<legend
				data-slot="field-legend"
				data-variant={variant}
				className={cn(
					"mb-3 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
					className,
				)}
				{...props}
			/>
		)
	}
}

export function FieldGroup() {
	return ({ className, ...props }: Props<"div">) => {
		return (
			<div
				data-slot="field-group"
				className={cn(
					"group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
					className,
				)}
				{...props}
			/>
		)
	}
}

const fieldVariants = cva("group/field flex w-full gap-3 data-[invalid=true]:text-destructive", {
	variants: {
		orientation: {
			vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
			horizontal:
				"flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
			responsive:
				"flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
		},
	},
	defaultVariants: {
		orientation: "vertical",
	},
})

export function Field() {
	return ({
		className,
		class: _class,
		orientation = "vertical",
		...props
	}: Props<"div"> & VariantProps<typeof fieldVariants>) => {
		return (
			<div
				role="group"
				data-slot="field"
				data-orientation={orientation}
				className={cn(fieldVariants({ orientation }), className, _class)}
				{...props}
			/>
		)
	}
}

export function FieldContent() {
	return ({ className, class: _class, ...props }: Props<"div">) => {
		return (
			<div
				data-slot="field-content"
				className={cn(
					"group/field-content flex flex-1 flex-col gap-1 leading-snug",
					className,
					_class,
				)}
				{...props}
			/>
		)
	}
}

export function FieldLabel() {
	return ({ className, class: _class, ...props }: LabelProps) => {
		return (
			<Label
				data-slot="field-label"
				className={cn(
					"group/field-label peer/field-label has-data-checked:bg-input/30 flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-[>[data-slot=field]]:rounded-2xl has-[>[data-slot=field]]:border *:data-[slot=field]:p-4",
					"has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
					className,
					_class,
				)}
				{...props}
			/>
		)
	}
}

export function FieldTitle() {
	return ({ className, class: _class, ...props }: Props<"div">) => {
		return (
			<div
				data-slot="field-label"
				className={cn(
					"flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
					className,
					_class,
				)}
				{...props}
			/>
		)
	}
}

export function FieldDescription() {
	return ({ className, class: _class, ...props }: Props<"p">) => {
		return (
			<p
				data-slot="field-description"
				className={cn(
					"text-muted-foreground text-left text-sm leading-normal font-normal group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
					"last:mt-0 nth-last-2:-mt-1",
					"[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
					className,
					_class,
				)}
				{...props}
			/>
		)
	}
}

export function FieldError() {
	return ({
		className,
		class: _class,
		children,
		errors,
		...props
	}: Props<"div"> & {
		errors?: Array<{ message?: string } | undefined>
	}) => {
		let content
		if (children) {
			content = children
		} else if (!errors?.length) {
			content = null
		} else {
			let uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()]

			if (uniqueErrors?.length == 1) {
				return uniqueErrors[0]?.message
			}

			content = (
				<ul className="ml-4 flex list-disc flex-col gap-1">
					{uniqueErrors.map(
						(error, index) => error?.message && <li key={index}>{error.message}</li>,
					)}
				</ul>
			)
		}

		if (!content) {
			return null
		}

		return (
			<div
				role="alert"
				data-slot="field-error"
				className={cn("text-destructive text-sm font-normal", className)}
				{...props}
			>
				{content}
			</div>
		)
	}
}
