import { Component, ReactNode } from "react";
import type { MetricsDistributionPoint } from "@/types/api";

interface FallbackProps {
  distribution: MetricsDistributionPoint[];
  label: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Chart render error boundary.
 *
 * If a chart fails to render (e.g. malformed data or an ECharts runtime
 * exception), this falls back to a plain text list of the distribution items
 * instead of crashing the whole report.
 */
export default class ChartErrorBoundary extends Component<
  { children: ReactNode; fallback: FallbackProps },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Swallow render errors — the fallback list is shown instead.
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { label, distribution } = this.props.fallback;
      return (
        <div>
          <p style={{ marginBottom: 8 }}>
            {label} (chart unavailable):
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {distribution.map((item) => (
              <li key={item.name}>
                {item.name}: {item.count}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return this.props.children;
  }
}
