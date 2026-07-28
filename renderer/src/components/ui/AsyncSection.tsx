import type { ReactNode } from "react";
import { EmptyState, ErrorText, Loading } from "./Feedback";

interface AsyncSectionProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  loadingLabel: string;
  emptyLabel: string;
  children: ReactNode;
}

/**
 * The loading / failed / empty / ready decision every data-driven step makes,
 * in one place so the four filter steps stay declarative.
 */
export function AsyncSection({
  loading,
  error,
  isEmpty,
  loadingLabel,
  emptyLabel,
  children,
}: AsyncSectionProps) {
  if (loading) return <Loading>{loadingLabel}</Loading>;
  if (error) return <ErrorText>{error}</ErrorText>;
  if (isEmpty) return <EmptyState>{emptyLabel}</EmptyState>;
  return <>{children}</>;
}
