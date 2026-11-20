import { Empty } from "../ui";

/** Nothing to show: say why, and what makes something appear. */
export function EmptyState({ icon = "users", title, children, action }: { icon?: string; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return <Empty icon={icon} title={title} action={action}>{children}</Empty>;
}
