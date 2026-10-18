import { Component } from "react";

export default class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <section role="alert" className="empty-state space-y-4 p-6">
          <h1 className="section-heading">Halaman belum dapat ditampilkan</h1>
          <p className="page-description">
            Muat ulang untuk mendapatkan versi aplikasi terbaru.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Muat ulang halaman
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
