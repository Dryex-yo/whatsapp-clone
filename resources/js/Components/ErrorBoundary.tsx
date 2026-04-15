import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorTimer: NodeJS.Timeout | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorTimer: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('Error caught by boundary:', error, errorInfo);
        }

        // Update state with error details
        this.setState({ errorInfo });

        // Auto-clear error after 30 seconds if user doesn't interact
        const timer = setTimeout(this.resetError, 30000);
        this.setState({ errorTimer: timer });

        // Optional: Send error to monitoring service (Sentry, etc.)
        // this.logErrorToService(error, errorInfo);
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorTimer: null,
        });
    };

    componentWillUnmount() {
        if (this.state.errorTimer) {
            clearTimeout(this.state.errorTimer);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Something went wrong
                            </h2>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4">
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                An unexpected error occurred. The application will attempt to recover automatically.
                            </p>

                            {import.meta.env.DEV && this.state.error && (
                                <details className="mb-4 text-sm">
                                    <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                        Error Details (Dev Only)
                                    </summary>
                                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Auto-recovering in a few seconds...
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
                            <button
                                onClick={this.resetError}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
