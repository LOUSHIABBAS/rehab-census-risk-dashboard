const FLAG_LABELS: Record<string, string> = {
  ama_risk: "AMA Risk",
  auth_lapse: "Authorization Lapse",
  missed_groups: "Missed Groups",
  failed_ua: "Failed UA",
  no_aftercare: "No Aftercare Plan",
};

type Props = { type: string };

export function FlagTypeLabel({ type }: Props) {
  return <span>{FLAG_LABELS[type] ?? type}</span>;
}
