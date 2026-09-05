import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Agent Graph Designer render error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
          <h1>Agent Graph Designer</h1>
          <p>アプリの初期化中にエラーが発生しました。</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {this.state.error.message}
          </pre>
        </main>
      );
    }

    return this.props.children;
  }
}
