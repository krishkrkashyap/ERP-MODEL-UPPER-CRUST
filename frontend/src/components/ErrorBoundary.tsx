import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Button } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Alert
            type="error"
            message="Something went wrong"
            description={
              <div>
                <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
                <Button type="primary" onClick={this.handleReset} style={{ marginTop: 16 }}>
                  Try Again
                </Button>
              </div>
            }
            showIcon
            style={{ maxWidth: 600 }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
